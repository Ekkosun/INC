var state_var = STATE_EDIT
timeoutid = 0


document.addEventListener("action", (e) => { state_machine(e) })



function state_machine(e) {
    let action = e.detail
    switch (state_var) {
        case STATE_EDIT:
            if (action != ACTION_COMPILE) {
                alert("请先进行文件的保存和编译！")
                break
            }
            compile_load()
            state_var = STATE_PRELOAD
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


function pause_handler() {
    $(".change").removeClass("change")
    $(".point").removeClass("point")
    get_globals_value()
    get_frame()
    refresh_buff()

    setTimeout(() => {
        if (state_var == STATE_PAUSE) {
            refresh_globals()
            refresh_editor()
            refresh_stack()
            if_have_attachment(program.curfile, program.curline)
            for (let i = 0; i < program.framenum; i++)
                updata_frame(program.frames[String(i)], String(i))
        }
    }, 1000)
}


function exit_handler() {
    clear_visual()
    clear_program_status()
    window.clearTimeout(timeoutid)

}


function next_line() {
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


function step_out() {
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

function get_var_addr(frame) {
    let n = parseInt(frame)
    let framen = String(program.framenum - 1 - n)
    if (!program.frames[frame])
        return
    let locals = program.frames[framen].locals
    if (locals) {
        for (let i = 0; i < locals.length; i++) {
            socket.emit("run_gdb_command", {
                "id": id,
                "cmd": ["-stack-select-frame " + frame, ((n + 1) * ADDR + i) + "-data-evaluate-expression &" + locals[i].name]
            })
        }
    }
}

function clear_program_status() {
    program = {
        "globalcmd": [],
        "curfile": null,
        "curline": null,
        "frames": {},
        "framenum": 0
    }
}

function refresh_buff() {
    socket.emit("run_gdb_command", {
        "id": id,
        "cmd": ["-data-evaluate-expression ((void(*)(int))fflush)(0)"]
    })
}