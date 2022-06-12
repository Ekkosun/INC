// var globals = []
// var globalcmd = []
// var curlocals
// var frames = {}

var cmd_queue = new Map()

SHOW_GLOBALS = 999
SHOW_FRAME = 10
SHOW_FRAME_ARGS = 11
SHOW_LOCAL_TYPE = 12
SHOW_LOCAL_VAR = 10000
SHOW_GLOBAL_ADD = 20000

var has_stack = false
var has_local_list = false
var is_value = false


function response_dispatch(response) {

    for (res of response) {
        if (res.type == "output")
            continue
        else if (res.type == "notify") {
            if (res.message) {
                if (res.message.indexOf("stopped") != -1) {
                    console.log(res.payload.reason)
                    if (res.payload.reason.indexOf("exited-normally") != -1) {
                        document.dispatchEvent(event(ACTION_EXIT))
                        alert("程序正常退出")
                    } else if (res.payload.reason.indexOf("breakpoint-hit") != -1) {
                        set_curposition(res)
                        document.dispatchEvent(event(ACTION_PAUSE_BREAK))
                    } else {
                        set_curposition(res)
                        if (iscontinue)
                            document.dispatchEvent(event(ACTION_PAUSE_CONTINUE))
                        else
                            document.dispatchEvent(event(ACTION_PAUSE_NORM))
                    }
                }
            }
        } else if (res.token >= SHOW_LOCAL_TYPE && res.token < 500) {
            parser_local(res)
            cmd_queue.delete(String(res.token))


        } else if (res.token >= SHOW_LOCAL_VAR && res.token < 2 * SHOW_LOCAL_VAR) {
            set_locals_value(res)
            cmd_queue.delete(String(res.token))


        } else if (res.token >= 1000 && res.token < 5000) {
            set_globals_value(res)
            cmd_queue.delete(String(res.token))

        } else if (res.token >= SHOW_GLOBAL_ADD && res.token < 2 * SHOW_GLOBAL_ADD) {
            set_globals_addr(res)
        } else if (res.token >= ADDR) {
            parser_local_addr(res)
            cmd_queue.delete(String(res.token))

        } else if (res.type == "result") {
            switch (res.token) {
                case SHOW_GLOBALS:
                    parser_global(res)
                    break
                case SHOW_FRAME:
                    parser_frame(res)
                    break
                case SHOW_FRAME_ARGS:
                    parser_frame_arg(res)
                    break
            }
            cmd_queue.delete(String(res.token))
        }
    }
}

function is_array(data) {
    if (!data)
        return false
    if (data.indexOf("[") != -1) {
        return true;
    }
    return false;
}

function is_ptr(data) {
    if (!data)
        return false
    if (data.indexOf("*") != -1)
        return true;
    return false
}

function parser_array(data, type, len) {
    var data = data.substr(1, data.length - 2)
    if (type.indexOf("char") != -1) {
        var arr = data.match(/\\[0-7]{3}|\\n|\\t|\\b|./g)
        if (arr.length < len) {
            arr.push("\\000")
        }
    } else if (type.indexOf("struct") != -1) {
        arr = data.match(/{.[^}]+}/g)
    } else {
        arr = data.split(", ")
    }
    return arr
}

function parser_global(res) {
    let i = 0
    program.globalcmd = []
    program.globals = []
    if (res.payload.symbols.debug)
        for (file of res.payload.symbols.debug) {
            let filename = file.filename
            for (let sym of file.symbols) {
                let varname = sym.name
                let vartype = sym.type
                let varvalue = null
                tmp = ""
                if (is_ptr(vartype)) {
                    tmp = "ptr"
                    program.globals.push({
                        "is": tmp,
                        "name": varname,
                        "type": vartype.substr(0, vartype.indexOf(" ")),
                        "value": varvalue,
                        "times": 0,
                        "len": parseInt(vartype.match(/[0-9]+/g)),
                        "addr": null
                    })
                } else if (is_array(vartype)) {
                    tmp = "array"
                    console.log(vartype)
                    program.globals.push({
                        "is": tmp,
                        "name": varname,
                        "type": vartype.substr(0, vartype.indexOf(" ")),
                        "value": varvalue,
                        "times": 0,
                        "addr": null
                    })
                } else {
                    program.globals.push({
                        "is": tmp,
                        "name": varname,
                        "type": vartype,
                        "value": varvalue,
                        "times": 0,
                        "addr": null
                    })
                }
                program.globalcmd.push(1000 + i + "-data-evaluate-expression " + "'" + filename + "'" + "::" + varname)
                program.globalcmd.push(SHOW_GLOBAL_ADD + i + "-data-evaluate-expression &" + "'" + filename + "'" + "::" + varname)
                i++
            }
        }
}

function get_globals_value() {
    socket.emit("run_gdb_command", {
        "id": id,
        "cmd": program.globalcmd,
    })

}

function set_globals_value(res) {
    let index = res.token
    program.globals[index - 1000].value = res.payload.value.split(" <")[0]
        // document.dispatchEvent(refresh())
}

function set_globals_addr(res) {
    if (!program.map) {
        program.map = new Map()
    }
    program.map.set(res.payload.value, program.globals[res.token - SHOW_GLOBAL_ADD].name)
    if (!program.globals[res.token - SHOW_GLOBAL_ADD].addr && res.payload.value) {
        program.globals[res.token - SHOW_GLOBAL_ADD].addr = res.payload.value.split(" ")[0]
    }
    // refresh_globals()
}

function get_frame() {
    has_stack = false
    socket.emit("run_gdb_command", {
            "id": id,
            "cmd": ["10-stack-list-frames", "11-stack-list-arguments --no-frame-filters --simple-values"],
        })
        // cmd_queue.set("10", ["10-stack-list-frames"])
        // cmd_queue.set("11", ["11-stack-list-arguments --no-frame-filters --simple-values"])
}

function get_locals() {
    localcmd = []
    for (i = 0; i < program.framenum; i++) {
        // localcmd.push((i + 12) + "-stack-list-locals --thread 1 --frame " + i + " --all-values")
        localcmd.push((i + 12) + "-stack-list-locals --thread 1 --frame " + i + " --simple-values")
        cmd_queue.set(String(i + 12), [(i + 12) + "-stack-list-locals --thread 1 --frame " + i + " --simple-values"])
    }
    socket.emit("run_gdb_command", {
        "id": id,
        "cmd": localcmd,
    })

}



function parser_frame(res) {
    if (has_stack == false) {
        for (let i = program.framenum; i < res.payload.stack.length; i++) {
            program.frames[String(i)] = null
        }
        program.framenum = res.payload.stack.length
        for (let frame of res.payload.stack) {
            let level = String(program.framenum - 1 - parseInt(frame.level))
            let func = frame.func
            let line = frame.line
            let arg = null
                // program.frames[level] = {
                //     "level": level,
                //     "func": func,
                //     "arg": arg,
                // }
            if (program.frames[level]) {
                program.frames[level].level = level
                program.frames[level].func = func
                program.frames[level].arg = arg
                program.frames[level].line = line
                program.frames[level].locals = null
            } else {
                program.frames[level] = {
                    "level": level,
                    "func": func,
                    "arg": arg,
                    "line": line,
                    "locals": null
                }
            }
        }
        //get_locals()
        // refresh_stack()
        // document.dispatchEvent(refresh())
        has_stack = true

    }
}

function parser_frame_arg(res) {
    for (let arg of res.payload['stack-args']) {
        let frame = String(program.framenum - 1 - parseInt(arg.level))
        let args = arg.args
        program.frames[frame].arg = args
        updata_frame_arg(program.frames[frame], frame)
    }
    // document.dispatchEvent(refresh())

}

function parser_frame_rsp(res) {
    let n = res.token - RSP
    program.frames[String(n)].rsp = res.payloade.value
}

function parser_frame_rsp(res) {
    let n = res.token - RBP
    program.frames[String(n)].rbp = res.payloade.value
}

function parser_local(res) {
    let locals = []
    if (!res.payload.locals)
        return

    for (let local of res.payload.locals) {
        let varname = local.name
        let vartype = local.type
        let varvalue = null
        if (is_array(vartype)) {
            console.log(vartype)

            locals.push({
                "is": "array",
                "name": varname,
                "type": vartype.substr(0, vartype.indexOf(" ")),
                "value": varvalue,
                "len": parseInt(vartype.match(/[0-9]+/g)),
                "times": 0,
                "addr": null
            })
        } else if (is_ptr(vartype)) {
            locals.push({
                "is": "ptr",
                "name": varname,
                "type": vartype.substr(0, vartype.indexOf(" ")),
                "value": varvalue,
                "times": 0,
                "addr": null
            })
        } else {
            locals.push({
                "is": "",
                "name": varname,
                "type": vartype,
                "value": varvalue,
                "times": 0,
                "addr": null
            })
        }
    }

    var framen = program.framenum - 1 - res.token + 12
    program.frames[String(framen)].locals = locals
        // socket.emit("run_gdb_command", {
        //     "id": id,
        //     "cmd": [(res.token - SHOW_LOCAL_TYPE + SHOW_LOCAL_VAR) + "-stack-list-locals --thread 1 --frame " + (res.token - SHOW_LOCAL_TYPE) + " --all-values"]
        // })
        // cmd_queue.set(String((res.token - SHOW_LOCAL_TYPE + SHOW_LOCAL_VAR)), [(res.token - SHOW_LOCAL_TYPE + SHOW_LOCAL_VAR) + "-stack-list-locals --thread 1 --frame " + (res.token - SHOW_LOCAL_TYPE) + " --all-values"])
}

function get_var_addr(frame) {
    let n = parseInt(frame)
    let framen = String(program.framenum - 1 - n)
    if (!program.frames[framen])
        return
    let locals = program.frames[framen].locals
    if (locals) {
        for (let i = 0; i < locals.length; i++) {
            socket.emit("run_gdb_command", {
                "id": id,
                "cmd": ["-stack-select-frame " + n, "-stack-select-frame " + n, ((n + 1) * ADDR + i) + "-data-evaluate-expression &" + locals[i].name]
            })
            cmd_queue.set(String(((n + 1) * ADDR + i)), ["-stack-select-frame " + n, "-stack-select-frame " + n, ((n + 1) * ADDR + i) + "-data-evaluate-expression &" + locals[i].name])
        }
    }
}

function set_locals_value(res) {

    var framen = program.framenum - 1 - (res.token - SHOW_LOCAL_VAR)
    if (!res.payload.locals)
        return
    for (let i = res.payload.locals.length - 1; i >= 0; i--) {
        if (res.payload.locals[i].value != undefined && program.frames[String(framen)].locals[i] != undefined) {
            program.frames[String(framen)].locals[i].value = res.payload.locals[i].value.split(" <")[0]
            if (program.frames[String(framen)].locals[i].value.indexOf(" \"" != -1)) {
                program.frames[String(framen)].locals[i].value = program.frames[String(framen)].locals[i].value.split(" \"")[0]
            }
        } else
            console.log(framen, i)
    }
    //get_var_addr(String(res.token - SHOW_LOCAL_VAR))
}

function escape(name) {
    for (var i = 0; i < name.length; i++) {
        if (name.charAt(i) != "~")
            break
    }
    return name.substr(i, name.length - i)
}

function parser_local_addr(res) {
    var frame = program.framenum - 1 - (Math.floor(res.token / ADDR) - 1)
    var index = res.token % ADDR
    if (!program.frames[String(frame)])
        return
    if (is_value == false) {
        if (program.frames[String(frame)].locals[index].addr == null && res.payload.value) {
            program.frames[String(frame)].locals[index].addr = res.payload.value.split(" <")[0]
            if (program.frames[String(frame)].locals[index].addr.indexOf(" \"" != -1)) {
                program.frames[String(frame)].locals[index].addr = program.frames[String(frame)].locals[index].addr.split(" \"")[0]
            }
        }
    } else {
        program.frames[String(frame)].locals[index].value = res.payload.value.split(" <")[0]
        if (program.frames[String(frame)].locals[index].value.indexOf(" \"" != -1)) {
            program.frames[String(frame)].locals[index].value = program.frames[String(frame)].locals[index].value.split(" \"")[0]
        }
    }
}



function get_addr(variable, frame) {
    if (program.frames[String(frame)].map) {
        for (let [key, val] of program.frames[String(frame)].map) {
            if (val == variable.name) {
                return key
            }
        }
        return null
    } else {
        return null
    }
}



function set_break_point(res) {

}

function set_curposition(res) {
    program.curfile = res.payload.frame.file
    program.curline = res.payload.frame.line
        // document.dispatchEvent(refresh())
}