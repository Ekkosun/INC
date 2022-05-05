import traceback
from flask import Flask, redirect, request, render_template, session , url_for, jsonify
from flask_socketio import SocketIO, emit
from flask_compress import Compress
import os
from utils import *
ResponseThread = None
app = Flask(__name__)
app.app_context().push()
websocket = SocketIO(app)
app.config["socket"] = websocket
import config
from db import User , Example,db
from checklogin import login
from mainpage import main
app.register_blueprint(login)
app.register_blueprint(main)
Compress(app)
manager = app.config["manager"]




@websocket.on("connect",namespace="/gdb_listener")
def connect_handler():
    desired_gdbpid = int(request.args.get("gdbpid", 0))
    try:
        if desired_gdbpid:
            debug_session = manager.connect_client_to_debug_session(
                desired_gdbpid=desired_gdbpid, client_id=request.sid
            )
            emit(
                "debug_session_connection_event",
                {
                    "ok": True,
                    "started_new_gdb_process": False,
                    "pid": debug_session.pid,
                    "message": f"Connected to existing gdb process {desired_gdbpid}",
                },
            )
        else:
            gdb_command = request.args.get("gdb_command", app.config["gdb_command"])
            mi_version = request.args.get("mi_version", "mi2")
            debug_session = manager.add_new_debug_session(
                gdb_command=gdb_command, mi_version=mi_version, client_id=request.sid
            )
            emit(
                "debug_session_connection_event",
                {
                    "ok": True,
                    "started_new_gdb_process": True,
                    "message": f"Started new gdb process, pid {debug_session.pid}",
                    "pid": debug_session.pid,
                },
            )
    except Exception as e:
        emit(
            "debug_session_connection_event",
            {"message": f"Failed to establish gdb session: {e}", "ok": False},
        )

    if manager.gdb_reader_thread is None:
        manager.gdb_reader_thread = websocket.start_background_task(
            target=read_and_forward_gdb_and_pty_output
        )
        logging.info("Created background thread to read gdb responses")

@websocket.on("set_dir",namespace="/gdb_listener")
def set_dir(data):
    id = data["id"]
    path = os.path.join(app.config["STORE_PATH"],id)
    client_id = request.sid  
    debug_session = manager.debug_session_from_client_id(client_id)
    if not debug_session:
        emit("error_running_gdb_command", {"message": "no session"})
        return
    pty_mi = debug_session.pygdbmi_controller
    if pty_mi is not None:
        try:
            cmds = [f"00-environment-cd {path}"]
            for cmd in cmds:
                pty_mi.write(
                    cmd + "\n",
                    timeout_sec=0,
                    raise_error_on_timeout=False,
                    read_response=False,
                )

        except Exception:
            err = traceback.format_exc()
            logging.error(err)
            emit("error_running_gdb_command", {"message": err})
    else:
        emit("error_running_gdb_command", {"message": "gdb is not running"})

    
@websocket.on("pty_interaction", namespace="/gdb_listener")
def pty_interaction(message):
    debug_session = manager.debug_session_from_client_id(request.sid)
    if not debug_session:
        emit(
            "error_running_gdb_command",
            {"message": f"no gdb session available for client id {request.sid}"},
        )
        return

    try:
        data = message.get("data")
        print(data)
        pty_name = data.get("pty_name")
        if pty_name == "user_pty":
            pty = debug_session.pty_for_gdb
        elif pty_name == "program_pty":
            pty = debug_session.pty_for_debugged_program
        else:
            raise ValueError(f"Unknown pty: {pty_name}")

        action = data.get("action")
        if action == "write":
            key = data["key"]
            pty.write(key)
        elif action == "set_winsize":
            pty.set_winsize(data["rows"], data["cols"])
        else:
            raise ValueError(f"Unknown action {action}")
    except Exception:
        err = traceback.format_exc()
        logging.error(err)
        emit("error_running_gdb_command", {"message": err})

@websocket.on("run_gdb_command", namespace="/gdb_listener")
def run_gdb_command(message):
    client_id = request.sid  
    debug_session = manager.debug_session_from_client_id(client_id)
    if not debug_session:
        emit("error_running_gdb_command", {"message": "no session"})
        return
    pty_mi = debug_session.pygdbmi_controller
    if pty_mi is not None:
        try:

            cmds = message["cmd"]
            print(cmds)
            for cmd in cmds:
                pty_mi.write(
                    cmd + "\n",
                    timeout_sec=0,
                    raise_error_on_timeout=False,
                    read_response=False,
                )

        except Exception:
            err = traceback.format_exc()
            logging.error(err)
            emit("error_running_gdb_command", {"message": err})
    else:
        emit("error_running_gdb_command", {"message": "gdb is not running"})

@websocket.on("disconnect", namespace="/gdb_listener")
def client_disconnected():
    """do nothing if client disconnects"""
    manager.disconnect_client(request.sid)
    logging.info("Client websocket disconnected, id %s" % (request.sid))

def read_and_forward_gdb_and_pty_output():

    while True:
        websocket.sleep(0.05)
        debug_sessions_to_remove = []
        for debug_session, client_ids in manager.debug_session_to_client_ids.items():
            try:
                try:
                    response = debug_session.pygdbmi_controller.get_gdb_response(
                        timeout_sec=0, raise_error_on_timeout=False
                    )

                except Exception:
                    response = None
                    send_msg_to_clients(
                        client_ids,
                        "The underlying gdb process has been killed. This tab will no longer function as expected.",
                        error=True,
                    )
                    debug_sessions_to_remove.append(debug_session)

                if response:
                    for client_id in client_ids:
                        logging.info(
                            "emiting message to websocket client id " + client_id
                        )
                        websocket.emit(
                            "gdb_response",
                            response,
                            namespace="/gdb_listener",
                            room=client_id,
                        )
                else:
                    # there was no queued response from gdb, not a problem
                    pass

            except Exception:
                logging.error("caught exception, continuing:" + traceback.format_exc())

        debug_sessions_to_remove += check_and_forward_pty_output()
        for debug_session in set(debug_sessions_to_remove):
            manager.remove_debug_session(debug_session)

def check_and_forward_pty_output():
    debug_sessions_to_remove = []
    for debug_session, client_ids in manager.debug_session_to_client_ids.items():
        try:
            response = debug_session.pty_for_gdb.read()
            if response is not None:
                for client_id in client_ids:
                    websocket.emit(
                        "user_pty_response",
                        response,
                        namespace="/gdb_listener",
                        room=client_id,
                    )

            response = debug_session.pty_for_debugged_program.read()
            if response is not None:
                for client_id in client_ids:
                    websocket.emit(
                        "program_pty_response",
                        response,
                        namespace="/gdb_listener",
                        room=client_id,
                    )
        except Exception as e:
            debug_sessions_to_remove.append(debug_session)
            for client_id in client_ids:
                websocket.emit(
                    "fatal_server_error",
                    {"message": str(e)},
                    namespace="/gdb_listener",
                    room=client_id,
                )
            logging.error(e, exc_info=True)
    return debug_sessions_to_remove

def send_msg_to_clients(client_ids, msg, error=False):
    if error:
        stream = "stderr"
    else:
        stream = "stdout"

    response = [{"message": None, "type": "console", "payload": msg, "stream": stream}]

    for client_id in client_ids:
        logging.info("emiting message to websocket client id " + client_id)
        websocket.emit(
            "gdb_response", response, namespace="/gdb_listener", room=client_id
        )

@websocket.on("compile",namespace="/gdb_listener")
def compile_handler(data):
    id = data["id"]
    path = os.path.join(app.config["STORE_PATH"],id)
    purepath = Path(path)
    for x in purepath.iterdir():
        if x.is_file() and (x.suffix == ".out" or x.suffix==".o"):
            os.remove(x.as_posix())
    os.chdir(path)
    cmd = f"gcc -g -c *.c "
    cmd += f"2>out 1>/dev/null"
    print(cmd)
    os.system(cmd)
    f = open(f"out", "r")
    data = f.read(20480)
    f.close()
    if data:
        emit("compile", {
            "status": False,
            "err": data
        })
        return 
    
    cmd = "ld -r  *.o -o a.o"
    cmd += f" 2>out 1>/dev/null"
    os.system(cmd)
    f = open(f"out", "r")
    data = f.read(20480)
    f.close()
    if data:
        emit("compile", {
            "status": False,
            "err": data
        })
        return 

    cmd = "gcc -g a.o "
    cmd += f"2>out 1>/dev/null"
    os.system(cmd)
    f = open(f"out", "r")
    data = f.read(20480)
    f.close()
    if data:
        emit("compile", {
            "status": False,
            "err": data
        })
        return 
    
    for x in purepath.iterdir():
        if x.is_file() and x.suffix == ".out":
            emit("compile", {
                "status": True
            })
            return
    emit("compile", {
        "status": False,
        "err": data
    })


@websocket.on("public_example",namespace="/gdb_listener")
def public_example(data):
    data = data["data"]
    id = data["id"]
    author  = data["author"]
    name = data["name"]
    description = data["description"]
    path = app.config["EXAMPLE_PATH"]
    example_path = os.path.join(path,id)
    cur_path = os.path.join(app.config["STORE_PATH"],id)
    if(Example.find(name,id)):
        print(name,id)
        print(Example.find(name,id))
        emit("public_example_response",{
            "status":False,
            "err":f"an example named {name} is already existed!"
        })
        return 
    if(not os.path.exists(example_path)):
        make_dir(example_path)
    name_path = os.path.join(example_path,name)
    description_path = os.path.join(name_path,"description")
    author_path = os.path.join(name_path,"author")
    if(os.path.exists(name_path)):
        shutil.rmtree(name_path)
        os.mkdir(name_path)
    else:
        os.mkdir(name_path)
    mk_write_file(description_path,description)
    mk_write_file(author_path,author)
    copy_search_file(cur_path,name_path)
    Example.add(id,name,description,name_path)
    
    emit("public_example_response",{
        "status":True,
        "err":f""
    })

@websocket.on("get_example_list",namespace="/gdb_listener")
def get_example_list():
    all_example = Example.query.all()
    example_list = []
    for example in all_example:
        example_list.append(f"{example.id} {example.name} {example.description}")
    emit("example_list",{
        "list":example_list
    })


@websocket.on("get_path",namespace="/gdb_listener")
def get_path(data):
    author_id = data["author_id"]
    id = data["id"]
    name = data["name"]
    path =os.path.join( app.config["EXAMPLE_PATH"],author_id)
    path =os.path.join( path,name)
    file_tree={}
    file_path=[]
    get_file(path,file_tree,file_path)
    cur_path = os.path.join(app.config["STORE_PATH"],id)
    clear_dir(cur_path)
    copy_search_file(path,cur_path)
    emit("get_path_response",{
        "path":file_path
    })
    
@websocket.on("get_my_public",namespace="/gdb_listener")
def get_my_public(data):
    author_id = data["id"]
    all_example = Example.find_by_id(author_id)
    example_list = []
    for example in all_example:
        example_list.append(f"{example.id} {example.name} {example.description}")
    emit("get_my_public_response",{
        "list":example_list
    })

@websocket.on("delete_my_public",namespace="/gdb_listener")
def delete_my_public(data):
    author_id = data["id"]
    name = data["name"]
    find = Example.find(name,author_id)
    try:
        if(isinstance(find,list)):
            for fi in find:
                shutil.rmtree(fi.dir_path)
                db.session.delete(fi)
                db.session.commit()
    except AttributeError:
        emit("delete_my_public_response",{
            "status":False
        })
        return 
    emit("delete_my_public_response",{
            "status":True
        })



if __name__ == '__main__':
    db.create_all()
    websocket.run(app, "0.0.0.0",debug=False)
