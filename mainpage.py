from flask import  Blueprint, redirect, render_template , request ,session, g , current_app ,jsonify , flash ,send_from_directory,make_response
from werkzeug.utils import secure_filename
from db import User,db
from flask_socketio import emit
import logging
import os
from utils import *
import magic
import pandas as pd

main = Blueprint("main_route",__name__)

websocket = current_app.config["socket"]

#todo , make a log dir


@main.route("/main")
def render_main():
    gdbpid = request.args.get("gdbpid",0)
    id = session["id"]
    user=User.find(id)
    path = os.path.join(current_app.config['STORE_PATH'],user.id)
    logging.info(f"User : {user.id} connect! Starting initial~")
    tree = {}
    file_path = []
    if user.dir_path == "":
        logging.info(f"Create dir:{path}")
        make_dir(path)
        user.dir_path = path
        db.session.commit()
    else:
        if os.path.exists(user.dir_path):
            make_dir(path)
    get_file(user.dir_path,tree,file_path)
    tree["text"] = user.name
    tree["state"] = {"opened": True}
    return render_template("main.html",gdbpid=gdbpid,filepath=file_path,id=id)



@main.route("/main/get_dir")
def file_handler():
    id = request.args.get("id")
    user = User.find(id)
    tree = {}
    file_path=[]
    get_file(user.dir_path,tree,file_path)
    tree["text"] = user.name
    tree["state"] = {"opened": True}
    return jsonify(tree)

@main.route("/main/upload_file", methods=['POST'])
def upload_file():
    form = request.form.to_dict(flat=True)
    user_id = form["id"]
    file_name = form["name"]
    file_content = form["data"]
    file_path = os.path.join(current_app.config["STORE_PATH"],user_id)
    file_path = os.path.join(file_path,file_name)
    mk_write_file(file_path,file_content)
    return jsonify("succeed")


@main.route("/main/remove_file", methods=['GET'])
def remove_file():
    id = request.args.get("id")
    filename = request.args.get("filename")
    user = User.find(id)
    file_path = os.path.join(user.dir_path,filename)
    os.remove(file_path)
    return jsonify("succeed")



@main.route("/main/upload_attachment", methods=['POST'])
def upload_attachment():
    form = request.form
    user_id = form["id"]
    file_name = form["name"]
    file_line = form["line"]
    file_des = form["des"]
    file_path = os.path.join(current_app.config["STORE_PATH"],user_id)
    des_path = os.path.join( file_path,file_name+file_line+".des")
    file_path =os.path.join( file_path,file_name+file_line+".asset")
    # f = open(file_path,"w")
    # f.write(f"{file_content}")
    # f.close()
    if request.method == 'POST':
        file = request.files['file']
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        filename = secure_filename(file.filename)
        file.save(file_path)
        mk_write_file(des_path,file_des)
        return  '{"filename":"%s"}' % filename
    return ''

@main.route("/main/ask_attachment", methods=['POST'])
def ask_attachment():
    form = request.form
    user_id = form["id"]
    file_name = form["name"]
    file_line = form["line"]
    file_path = os.path.join(current_app.config["STORE_PATH"],user_id)
    file_path =os.path.join( file_path,file_name+file_line+".asset")
    file_content = ""
    if(os.path.exists(file_path)):
        filetype= magic.from_file(file_path, mime=True)
        if(filetype=="text/plain"):
            f = open(file_path,"r")
            file_content = f.read(204800)
            f.close()

        return jsonify({
            "is":True,
            "type":filetype,
            "data":file_content
        })
    else :
        return jsonify({
            "is":False,
            "type":"",
            "data":""
        })

@main.route("/main/attachment/<id>/<file_name>",methods=['GET'])
def send_attachment(id,file_name):
    file_path = os.path.join(current_app.config["STORE_PATH"],id)
    #file_path =os.path.join( file_path,file_name+".asset")
    print(file_path+file_name+".asset")
    response = make_response(send_from_directory(file_path,file_name+".asset"))
    return response

@main.route("/main/ask_attachment_list",methods=['POST'])
def send_attachment_list():
    form = request.form
    files = []
    id = form["id"]
    file_path = os.path.join(current_app.config["STORE_PATH"],id)
    file_path = Path(file_path)
    fs = [x for x in file_path.iterdir() if x.is_file() and x.suffix==".asset"]
    for f in fs:
        file_tpye = magic.from_file(f.as_posix(),mime=True)
        pos = f.stem.find(".c")
        if(pos==-1):
            pos = f.stem.find(".h")
            if(pos==-1):
                continue
        file_name = f.stem[0:pos+2]
        file_line = f.stem[pos+2:]
        rf = open(os.path.join(file_path.as_posix(),f"{file_name}{file_line}.des"),"r")
        file_des = rf.read(204800)
        files.append({
            "file_name":file_name,
            "file_line":file_line,
            "file_type":file_tpye,
            "file_des":file_des
        })
    return jsonify({
        "list":files
    })

@main.route("/admin/ask_usr_list",methods=["POST"])
def send_usr_list():
    usr = User.query.all()
    data = []
    for u in usr:
        data.append({
            "usr_name":u.id,
            "usr_line":u.name,
            "usr_des":u.email
        })
    return jsonify({
        "list":data
    })

@main.route("/admin/delete_usr",methods=["POST"])
def delete_usr():
    form = request.form
    id = form["id"]
    usr = User.find(id)
    if usr:
        db.session.delete(usr)
        db.session.commit()
    return  jsonify({
        "status":True
    })

@main.route("/admin/upload_csv",methods=["POST"])
def parse_csv():
    file = request.files['file']
    csv_data = pd.read_csv(file,names=['0','1','2','3'])
    for _,row in csv_data.iterrows():
        value = row.values
        print(value)
        if(User.find(value[0])):
            continue
        else: 
            User.add(value[0],value[1],value[3],value[2])
    return jsonify({
        "status":True
    })


@main.route("/admin")
def admin():
    return render_template("admin.html")

@websocket.on("pull_file",namespace="/gdb_listener")
def push_file(data):
    filepath = str(data)
    data = readfile(filepath)
    filename = os.path.basename(filepath)
    emit("push_file",{
        "name":filename,
        "data":data,
    })


