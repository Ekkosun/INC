var state_var = STATE_EDIT
timeoutid = 0
var cur_send = ""
var timeout = 0

document.addEventListener("action", (e) => { state_machine(e) })



function state_machine(e) {
    let action = e.detail
    switch (state_var) {
        case STATE_EDIT:
            if (action == ACTION_COMPILE) {
                compile_load()
                state_var = STATE_PRELOAD
            } else if (action == ACTION_START) {
                start_run()
                state_var = STATE_RUN
            } else if (action == ACTION_CONTINUE || action == ACTION_NEXT || action == ACTION_STEPIN || action == ACTION_STEPOUT || action == ACTION_RUN_CURSOR) {
                alert("请先运行程序!")
            } else {

            }
            break

        case STATE_PRELOAD:
            if (action == ACTION_START) {
                start_run()
                state_var = STATE_RUN
            } else if (action == ACTION_EXIT) {
                exit_run()
                state_var = STATE_EDIT
            } else if (action == ACTION_COMPILE) {
                compile_load()
                state_var = STATE_PRELOAD
            } else if (action == ACTION_COMPILE_FAILED)
                state_var = STATE_EDIT
            else if (action == ACTION_COMPILE) {
                compile_load()
            } else if (action == ACTION_CONTINUE || action == ACTION_NEXT || action == ACTION_STEPIN || action == ACTION_STEPOUT || action == ACTION_RUN_CURSOR) {
                alert("请先运行程序!")
            }
            break

        case STATE_RUN:
            if (action == ACTION_PAUSE_BREAK) {
                pause_handler()
                iscontinue = 0
                state_var = STATE_PAUSE
            } else if (action == ACTION_PAUSE_EXIT) {
                exit_run()
                state_var = STATE_EXIT
            } else if (action == ACTION_EXIT) {
                state_var = STATE_EXIT
                exit_run()
            } else if (action == ACTION_PAUSE_CONTINUE) {
                pause_handler()
                timeoutid = setTimeout((e) => {
                    document.dispatchEvent(event(ACTION_CONTINUE))
                }, TIMEOUT)
                state_var = STATE_PAUSE
            } else if (action == ACTION_PAUSE_NORM) {
                pause_handler()
                iscontinue = 0
                state_var = STATE_PAUSE
                window.clearTimeout(timeoutid)
            }
            break

        case STATE_PAUSE:
            if (action == ACTION_NEXT) {
                next_line()
                state_var = STATE_RUN
            } else if (action == ACTION_STEPIN) {
                step_in()
                state_var = STATE_RUN
            } else if (action == ACTION_STEPOUT) {
                step_out()
                state_var = STATE_RUN
            } else if (action == ACTION_START) {
                start_run()
                state_var = STATE_RUN
            } else if (action == ACTION_EXIT) {
                exit_run()
                state_var = STATE_EDIT
            } else if (action == ACTION_COMPILE) {
                compile_load()
                state_var = STATE_PRELOAD
            } else if (action == ACTION_CONTINUE) {
                step_in()
                state_var = STATE_RUN
            } else if (action == ACTION_PAUSE_NORM) {
                pause_handler()
                iscontinue = 0
                state_var = STATE_PAUSE
                window.clearTimeout(timeoutid)
            } else if (action == ACTION_RUN_CURSOR) {
                run_to_cursor()
                state_var = STATE_RUN
            }

            break

        case STATE_EXIT:
            if (action == ACTION_NEXT) {
                next_line()
                state_var = STATE_RUN
            } else if (action == ACTION_STEPIN) {
                step_in()
                state_var = STATE_RUN
            } else if (action == ACTION_STEPOUT) {
                step_out()
                state_var = STATE_RUN
            } else if (action == ACTION_START) {
                start_run()
                state_var = STATE_RUN
            } else if (action == ACTION_EXIT) {
                exit_run()
                state_var = STATE_PRELOAD
            } else if (action == ACTION_COMPILE) {
                compile_load()
                state_var = STATE_PRELOAD
            }

            break




    }
}



function compile_load() {
    socket.emit("compile", {
        "id": id
    })

}


function start_run() {
    set_break()
    let cmd = new Array()
    if (addarray.length) {
        for (let v of addarray)
            cmd.push(v)
        addarray = []
    }
    if (deletearray.length) {
        for (let v of deletearray)
            cmd.push(v)
        deletearray = []
    }
    // cmd.push("-break-delete")
    cmd.push("-exec-run")
    editor.setReadOnly(true)
    socket.emit("run_gdb_command", {
        "id": id,
        "cmd": cmd
    })

    $("#compileinfo").css("display", "none")
    $("#show_attachment").empty()
    $("#show_attachment").css("display", "block")
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function is_equal_op(str) {
    if (str.indexOf("=") != -1) {
        let variable = str.split("=")[0]
        return variable
    } else
        return null
}

function is_compare_op(str) {
    if (str.indexOf("<") != -1 || str.indexOf(">") != -1 || str.indexOf("==") != -1) {
        let variable = str.split("=")[1]
        if (variable.length > 0)
            variable = variable[0].split(" ")
        for (let i = variable.length - 1; i >= 0; i--) {
            if (variable[i] != "") {
                return variable[i]
            }
        }
    } else
        return null
}


function pause_handler() {
    $(".change").removeClass("change")
    $(".point").removeClass("point")
    let value = editor.session.getLine(program.curline - 1)
    console.log(value)
    program.framenum = 0
    if (value.indexOf("main()") != -1 || (value.indexOf("{") != -1 && value.indexOf("=") == -1) || (value.indexOf("{") != -1 && value.indexOf("=") == -1)) {
        next_line()
    }
    value = editor.session.getLine(program.curline - 2)
    let variable = is_equal_op(value)
    get_globals_value()
    get_frame()
    refresh_buff() //TODO: jiejue le shen me wen ti
    let interval = setInterval(() => {
        if (program.framenum == 0) {
            if (cur_send != "get_frame") {
                cur_send = "get_frame"
                get_frame()
            }
            return
        }
        for (let i = 0; i < program.framenum; i++) {
            if (program.frames[String(i)].locals == null) {
                if (cur_send != "get_locals") {
                    cur_send = "get_locals"
                    get_locals()
                }
                return
            }
            for (let j = 0; j < program.frames[String(i)].locals.length; j++) {
                if (program.frames[String(i)].locals[j].value == null) {
                    is_value = true
                    let n = program.framenum - 1 - i
                    if (cur_send != "value " + n + j) {
                        socket.emit("run_gdb_command", {
                            "id": id,
                            "cmd": ["-stack-select-frame " + n, ((n + 1) * ADDR + j) + "-data-evaluate-expression " + program.frames[String(i)].locals[j].name]
                        })
                        cur_send = "value " + n + j
                    }
                    return
                } else if (program.frames[String(i)].locals[j].addr == null) {
                    is_value = false
                    let n = program.framenum - 1 - i
                    if (cur_send != "addr " + n + j) {
                        socket.emit("run_gdb_command", {
                            "id": id,
                            "cmd": ["-stack-select-frame " + n, ((n + 1) * ADDR + j) + "-data-evaluate-expression &" + program.frames[String(i)].locals[j].name]
                        })
                        cur_send = "addr " + n + j
                    }
                    return
                }
            }
        }
        clearInterval(interval)
        setTimeout(() => {
            if (state_var == STATE_PAUSE) {
                refresh_globals()
                refresh_editor()
                refresh_stack()
                if_have_attachment(program.curfile, program.curline)
                for (let i = 0; i < program.framenum; i++) {
                    updata_frame(program.frames[String(i)], String(i))
                }
                let frame = $("#stack").find("#" + (program.framenum - 1))
                let list = frame.find(".item").get()
                if (variable != null)
                    for (v of list) {
                        let name = $(v).find(".name").text()
                        if (variable.indexOf(name) != -1) {
                            let i = variable.indexOf(name) + name.length
                            if (i == variable.length || variable[i] == " ")
                                $(v).find(".canzhi").remove()
                        }
                    }
            }
        }, 500)
    }, 10)

}


function exit_handler() {
    clear_visual()
    clear_program_status()
    window.clearTimeout(timeoutid)

}


function next_line() {
    set_break()
    let cmd = new Array()
    if (addarray.length) {
        for (let v of addarray)
            cmd.push(v)
        addarray = []
    }
    if (deletearray.length) {
        for (let v of deletearray)
            cmd.push(v)
        deletearray = []
    }
    cmd.push("-stack-select-frame 0")
    cmd.push("-exec-next")
    socket.emit("run_gdb_command", {
        "id": id,
        "cmd": cmd
    })

}

function step_in() {
    set_break()
    let cmd = new Array()
    if (addarray.length) {
        for (let v of addarray)
            cmd.push(v)
        addarray = []
    }
    if (deletearray.length) {
        for (let v of deletearray)
            cmd.push(v)
        deletearray = []
    }
    cmd.push("-stack-select-frame 0")
    cmd.push("-exec-step")
    socket.emit("run_gdb_command", {
        "id": id,
        "cmd": cmd
    })

}

function run_to_cursor() {
    let file = curfile
    let line = editor.getCursorPosition().row + 1
    cmd = ["-exec-until " + file + ":" + line]
    socket.emit("run_gdb_command", {
        "id": id,
        "cmd": cmd
    })
}

function step_out() {
    set_break()
    let cmd = new Array()
    if (addarray.length) {
        for (let v of addarray)
            cmd.push(v)
        addarray = []
    }
    if (deletearray.length) {
        for (let v of deletearray)
            cmd.push(v)
        deletearray = []
    }
    cmd.push("-stack-select-frame 0")
    cmd.push("-exec-finish")
    socket.emit("run_gdb_command", {
        "id": id,
        "cmd": cmd
    })

}

function exit_run() {
    clear_visual()
    clear_program_status()
    map = new Map()
    cmd = new Array()
    cmd.push("-break-delete")
    socket.emit("run_gdb_command", {
        "id": id,
        "cmd": cmd
    })
    window.clearTimeout(timeoutid)
    $("#compileinfo").css("display", "block")
    $("#show_attachment").css("display", "none")
}

function get_rsp_rbp(frame) {
    socket.emit("run_gdb_command", {
        "id": id,
        "cmd": ["-stack-select-frame " + frame, frame + RBP + "-data-evaluate-expression $rbp", frame + RSP + "-data-evaluate-expression $rsp"]
    })
}

function get_all_rsp_rbp() {
    for (let i = 0; i < framenum; i++) {
        get_rsp_rbp(i)
    }
}



function clear_program_status() {
    program.curfile = null
    program.curline = null
    program.frames = {}
    program.framenum = 0
}

function refresh_buff() {
    socket.emit("run_gdb_command", {
        "id": id,
        "cmd": ["-data-evaluate-expression ((void(*)(int))fflush)(0)"]
    })
}