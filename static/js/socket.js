socket.on("connect", () => {
    PullFile(file_path)
})




socket.on("push_file", (response) => {
    let filename = response.name
    let filedata = response.data
    sessionStorage.setItem(filename, filedata)
    if (!curfile)
        curfile = filename
})


var compile = document.getElementById("compile-load")

compile.addEventListener("click", (e) => {
    e.preventDefault()
    document.dispatchEvent(event(ACTION_COMPILE))
})


function getglobal(data) {
    console.log(data)
}
var output = document.getElementById("ss0")

socket.on("debug_session_connection_event", (data) => {
    if (data.ok) {
        socket.emit("set_dir", {
            "id": id,
        })
        gdbpid = data.pid
    }
})


socket.on("compile", (data) => {

    if (program.compileinfo)
        for (v of program.compileinfo) {
            editor.session.removeMarker(v.marker)
            v.marker = null
        }
    $("#compileinfo").find(".info").remove()
    program.compileinfo = new Array()
    if (data.status) {
        alert("compile succeed!")
        program.compileinfo = new Array()
        socket.emit("run_gdb_command", {
            "id": id,
            "cmd": ["0-file-exec-and-symbols ./a.o",
                "999-symbol-info-variables ",
                "0-file-exec-and-symbols ./a.out",
                "0-break-insert main",
            ]
        })
    } else {
        alert("comlie failed")
            // console.log(data.err)
        info_parser(data.err)
        document.dispatchEvent(event(ACTION_COMPILE_FAILED))
    }
})


var start = document.getElementById("control-start")
start.addEventListener('click', (e) => {
    e.preventDefault()
    document.dispatchEvent(event(ACTION_START))
})


var run = document.getElementById("control-run")
run.addEventListener('click', (e) => {
    e.preventDefault()
    iscontinue = 1
    document.dispatchEvent(event(ACTION_CONTINUE))
})

var next = document.getElementById("control-next")
next.addEventListener('click', (e) => {
    e.preventDefault()
    document.dispatchEvent(event(ACTION_NEXT))
})

var stepin = document.getElementById("control-stepin")
stepin.addEventListener('click', (e) => {
    e.preventDefault()
    document.dispatchEvent(event(ACTION_STEPIN))
})

var stepout = document.getElementById("control-stepout")
stepout.addEventListener('click', (e) => {
    e.preventDefault()
    document.dispatchEvent(event(ACTION_STEPOUT))
})

var pause = document.getElementById("control-pause")
pause.addEventListener('click', (e) => {
    e.preventDefault()
    document.dispatchEvent(event(ACTION_PAUSE_NORM))
})

var stop = document.getElementById("control-stop")
stop.addEventListener('click', (e) => {
    e.preventDefault()
    document.dispatchEvent(event(ACTION_EXIT))
})


function PullFile(file_path) {
    for (v of file_path) {
        socket.emit("pull_file", v)
    }
}


socket.on("error_running_gdb_command", (data) => {
    alert(data.message)
})

var test
socket.on("gdb_response", (data) => {
    response_dispatch(data)
    console.log(data)
})


socket.on("program_pty_response", (data) => {
    let len = data.length
    console.log(data)
    if (data[len - 1] == '\n') {
        data = data.substr(0, data.length - 1);
        $('#terminal').terminal().echo(data)
    } else
        $('#terminal').terminal().echo(data, { newline: false })
})

function send_input(data) {
    socket.emit("pty_interaction", {
        "data": {
            "pty_name": "program_pty",
            "action": "write",
            "key": data + "\n"
        }
    })
}