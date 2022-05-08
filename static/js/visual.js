var stack = document.getElementById("stack")


function create_frame(func, id) {
    let frame = $("<div class='cards shadow-1' id=" + id + " >\
        <div class='tag unselect nolength'>" + func + "<a><img></a>" + "</div>\
        <div class='locals'>\
    </div>\
    </div>")
    $('#stack').append(frame)
    frame.children(".locals").on('dblclick', ".item", function() {
        let data = $(this).find('.ptrorarray').text()
        if ($(this).find('.ptrorarray').text() == "") {
            return
        } else if ($(this).find('.ptrorarray').first().text() == "array") {
            list_item($(this))
        } else if ($(this).find('.ptrorarray').first().text() == "ptr") {
            list_pointer($(this))
        }
    })
}


function list_item(item) {
    let data = item.find('.value').first().text()
    let type = item.find('.type').first().text()
    data = parser_array(data, type)
    let name = item.find('.name').text()
    if (item.children("ul").length <= 0) {
        list = $("<ul class='item_list'></ul>")
        for (i = 0; i < data.length; i++) {
            let list_item = $("<li class='menu unselect'><div class='ptrorarray'>" + name + "[" + i + "]" + "</div>" + "<div class='value'>" + data[i] + "</div>" + "</div>")
            list.append(list_item)
        }
        item.append(list)
        item.children(".menu").addClass("havelist")
        item.children("ul").css("display", "none")

    } else {
        if (item.children("ul").css("display") == "none") {
            item.find("img").attr("src", "static/icon/collapse-all.svg")
            $("#chart_dis").css("display", "flex")
            $("#chart_dis").css("width", "50%")
            $('#memo_dis').css("width", "50%")
            item.children("ul").css("display", "block")
            $("#split-2").css("display", "flex")
            $("#split-2").css("flex-direction", "row")

        } else {
            item.find("img").attr("src", "static/icon/expand-all.svg")
            $("#chart_dis").css("display", "none")
            $('#memo_dis').css("width", "100%")
            $("#split-2").css("display", "block")
            item.children("ul").css("display", "none")
        }
    }

}

function updata_list(item) {
    let data = item.find('.value').first().text()
    let type = item.find('.type').first().text()
    data = parser_array(data, type)
    if (item.children("ul").length > 0) {
        for (i = 0; i < data.length; i++) {
            if (item.children("ul").children("li").eq(i).children('.value').text() == data[i]) {
                // item.children("ul").children("li").eq(i).removeClass("change")
                continue
            } else {
                item.children("ul").children("li").eq(i).addClass("change")
                item.children("ul").children("li").eq(i).children('.value').text(data[i])
            }
        }
    }
}

function update_var(dom, variable) {
    let id = variable.name + variable.times
    if (dom.children("#" + variable.name + variable.times).length > 0) {
        if (dom.children("#" + variable.name + variable.times).find('.ptrorarray').text() == "ptr") {
            let value = dom.children("#" + variable.name + variable.times).find('.value').first().text()
            if (value != variable.value) {
                dom.children("#" + variable.name + variable.times).find('.value').first().text(variable.value)
                dom.children("#" + variable.name + variable.times).children('.menu').addClass("change")
                dom.children("#" + variable.name + variable.times).removeClass("unused")

            } else {
                // dom.children("#" + variable.name + variable.times).children('.menu').removeClass("change")
                dom.children("#" + variable.name + variable.times).removeClass("unused")
            }
            list_pointer(dom.children("#" + variable.name + variable.times))
                // dom.children("#" + variable.name + variable.times).children('.menu').removeClass("change")
        } else if (dom.children("#" + variable.name + variable.times).find('.ptrorarray').text() == "array") {
            let value = dom.children("#" + variable.name + variable.times).find('.value').first().text()
            if (value != variable.value) {
                dom.children("#" + variable.name + variable.times).find('.value').first().text(variable.value)
                dom.children("#" + variable.name + variable.times).children('.menu').addClass("change")
                dom.children("#" + variable.name + variable.times).removeClass("unused")
            } else {
                // dom.children("#" + variable.name + variable.times).children('.menu').removeClass("change")
                dom.children("#" + variable.name + variable.times).removeClass("unused")
            }
            list_item(dom.children("#" + variable.name + variable.times))
                // dom.children("#" + variable.name + variable.times).children('.menu').removeClass("change")
        } else {
            let value = dom.children("#" + variable.name + variable.times).find('.value').first().text()
            if (value != variable.value) {
                dom.children("#" + variable.name + variable.times).find('.value').first().text(variable.value)
                dom.children("#" + variable.name + variable.times).children('.menu').addClass("change")
                dom.children("#" + variable.name + variable.times).removeClass("unused")
            } else {
                // dom.children("#" + variable.name + variable.times).children('.menu').removeClass("change")
                dom.children("#" + variable.name + variable.times).removeClass("unused")
            }
        }
        // if (dom.children("#" + variable.name+i).children(".item_list").length > 0)
        updata_list(dom.children("#" + variable.name + variable.times))

    } else {
        let item = $("<div " + "id=" + variable.name + variable.times + " class='item'>" + "<div class='menu unselect'>" + "<div class='ptrorarray'>" + variable.is + "</div>" + "<div class='type'>" + variable.type + "</div>" + "<div class='name'>" + variable.name + "</div> " + "<div class = 'value'>" + variable.value + "</div>" + "<div class = 'to'>" + "" + "</div>" + "<a><img></a>" + "</div> " + "</div> ")

        dom.append(item)
        if (variable.is == "ptr") {
            list_pointer(item)
        } else if (variable.is == "array") {
            item.find("img").attr("src", "static/icon/expand-all.svg")
            item.find("img").attr("id", "collapse")
            item.find("img").off()
            item.find("img").on("click", () => {
                list_item(item)
            })
            list_item(item)
        }
        // item.children(".menu").addClass("change")
    }
}

function refresh_globals() {
    if (program.globals) {
        for (let i = 0; i < program.globals.length; i++) {
            update_var($('#globals'), program.globals[i])
        }
    }
}

function updata_frame_arg(frame, level) {
    var data = frame.func + "("
        // if (frame.arg.length) {
        //     j = 0
        //     for (arg of frame.arg) {
        //         if (j == 0) {
        //             data += arg.type + " " + arg.name + "=" + arg.value
        //             j = 1
        //         } else
        //             data += " , " + arg.type + " " + arg.name + "=" + arg.value
        //     }
        // }
    data = data + ")"
    stack = $('#stack')
    let id = level
    if (stack.children("#" + id).length > 0) {
        stack.children("#" + id).children(".tag").text(data)
    } else {
        create_frame(data, id)
    }
}



function updata_frame(frame, level) {

    stack = $('#stack')
    let id = level
        // stack.children("#" + id).children(".tag").removeClass("change")
    if (stack.children("#" + id).length > 0) {
        stack.children("#" + id).removeClass("unused")
        stack.children("#" + id).children(".locals").children(".item").addClass("unused")
        if (frame.locals)
            for (let i = 0; i < frame.locals.length; i++) {

                update_var(stack.children("#" + id).children(".locals"), frame.locals[i])
            }
        if (frame.arg)
            for (arg of frame.arg) {
                let type = ""
                if (arg.type.indexOf("*") != -1)
                    type = "ptr"
                else if (arg.type.indexOf("[") != -1)
                    type = "array"
                let tmp = {
                    "is": type,
                    "name": arg.name,
                    "value": arg.value,
                    "type": arg.type,
                    "times": 0
                }
                update_var(stack.children("#" + id).children(".locals"), tmp)
            }
        stack.children("#" + id).find(".unused").remove()
    } else {
        if (frame)
            if (frame.locals)
                for (let i = 0; i < frame.locals.length; i++) {
                    update_var(stack.children("#" + id).children(".locals"), frame.locals[i])
                }
    }
    if (stack.children("#" + id).find(".change").length > 0)
        stack.children("#" + id).children(".tag").addClass("change")
}

function refresh_stack() {
    var stack = $('#stack')
    stack.children(".cards").addClass('unused')
    for (let i = 0; i < program.framenum; i++) {

        let id = String(i)
        if (stack.children("#" + id).length > 0) {
            stack.children("#" + id).removeClass("unused")
        }
    }
    $('#stack').children(".unused").remove()

}


function refresh_editor() {
    if (marker)
        editor.session.removeMarker(marker)
    if (program.curfile && curfile && program.curfile != curfile) {
        deselect(curfile)
        curfile = program.curfile
        editor.session.clearBreakpoints()

        if (breakarray[curfile]) {
            breakarray[curfile].forEach((v, i) => {
                editor.session.setBreakpoint(i)
            });
        }
        select(curfile)
    }
    marker = editor.session.addMarker(new Range(program.curline - 1, 0, program.curline - 1, 1), "curMarker", "fullLine");
    if (!last_row) {
        last_row = program.curline - 1
        editor.session.addGutterDecoration(last_row, "curMarker")
    } else {
        editor.session.removeGutterDecoration(last_row, "curMarker")
        last_row = program.curline - 1
        editor.session.addGutterDecoration(last_row, "curMarker")
    }
    editor.gotoLine(program.curline)
}

function check_global_type(val, type) {
    for (let i = 0; i < program.globals.length; i++) {
        if ((program.globals[i].type == type) && (program.globals[i].name == val))
            return program.globals[i].name + program.globals[i].times
    }
    return null
}

function check_global_addr(addr, type) {
    if (program.map)
        for (let [key, val] of program.map) {
            let id = check_global_type(val, type)
            if (key == addr && id)
                return [val, id]
        }
    return [null, null]
}

function check_local_type(val, type) {
    for (let i = 0; i < program.framenum; i++) {
        let frame = program.frames[String(i)]
        if (frame)
            if (frame.locals.length)
                for (let j = 0; j < frame.locals.length; j++) {
                    if (frame.locals[j].name == val && frame.locals[j].type == type)
                        return frame.locals[j].name + frame.locals[j].times
                }

    }
    return null
}

function check_local_addr(addr, type) {
    for (let i = 0; i < program.framenum; i++) {
        let frame = program.frames[String(i)]
        if (frame)
            if (frame.map)
                for (let [key, val] of frame.map) {
                    let id = check_local_type(escape(val), type)
                    if (key == addr && id) {
                        return [val, id]
                    }
                }

    }
    return [null, null]
}

function randomColor() {
    var color = "";
    for (var i = 0; i < 6; i++) {
        color += (Math.random() * 16 | 0).toString(16);
    }
    return "#" + color;
}



function list_pointer(dom) {
    let ptr = dom.children(".menu").find(".value").text()
    let domid = dom.attr('id')
    if (ptr == "0x0") {
        dom.children(".menu").find(".to").text("NULL")
        dom.children(".menu").css("background-color", "green")
        dom.children(".menu").css("color", "black")
        return
    }
    let type = dom.children(".menu").find(".type").text()
    let [val, item] = check_global_addr(ptr, type)
    if (!val) {
        [val, item] = check_local_addr(ptr, type)
    }
    if (!val) {
        dom.children(".menu").find(".to").text("wild pointer")
        dom.children(".menu").css("background-color", "yellow")
        dom.children(".menu").css("color", "black")
    } else {

        if (!point_color.has(domid)) {
            let color = randomColor()
            point_color.set(domid, [color, item])
        }
        dom.children(".menu").css("background-color", point_color.get(domid)[0])
        let last = point_color.get(domid)[1]
        $("#" + last).children(".menu").css("background-color", "#888a90")
        $("#" + item).children(".menu").css("background-color", point_color.get(domid)[0])
        dom.children(".menu").addClass("point")
        dom.children(".menu").find(".to").text("&" + escape(val))
        dom.children(".menu").css("color", "black")
            // $("#" + item).children(".menu").css("background-color", "blue")
    }

}

function create_compile_info(info) {

    let dom = $("#compileinfo")
    let item = $("<div  class='info'>" + "<div class='" + info.level + "'>" + info.level + "</div>" + "<div class='position'>" + info.file + ":" + info.line + "</div>" + "<div class='msg nolength'>" + info.msg + "</div>" + "</div> ")
    dom.append(item)
        // item.children(".menu").addClass("change")

}

function visual_info() {
    if (program.compileinfo)
        for (let v of program.compileinfo) {
            if (v.file == curfile) {
                if (v.level == "Error")
                    v.marker = editor.session.addMarker(new Range(v.line - 1, 0, v.line - 1, 1), "errMarker", "fullLine");
                else if (v.level == "Warning")
                    v.marker = editor.session.addMarker(new Range(v.line - 1, 0, v.line - 1, 1), "warningMarker", "fullLine");
            }
            create_compile_info(v)
        }
}

function info_parser(err) {
    let arr = err.split("\n")
    for (let v of arr) {
        if (v.indexOf("error") != -1) {
            let file = v.substr(0, v.indexOf(":"))
            v = v.substr(v.indexOf(":") + 1, v.length - v.indexOf(":") - 1)
            let line = v.substr(0, v.indexOf(":"))
            v = v.substr(v.indexOf(":") + 1, v.length - v.indexOf(":") - 1)
            v = v.substr(v.indexOf(":") + 1, v.length - v.indexOf(":") - 1)
            v = v.substr(v.indexOf(":") + 1, v.length - v.indexOf(":") - 1)
            let error = v
            if (!program.compileinfo)
                program.compileinfo = new Array()
            program.compileinfo.push({
                "level": "Error",
                "file": file,
                "line": parseInt(line),
                "msg": error,
                "marker": null
            })
        } else if (v.indexOf("warning") != -1) {
            let file = v.substr(0, v.indexOf(":"))
            v = v.substr(v.indexOf(":") + 1, v.length - v.indexOf(":") - 1)
            let line = v.substr(0, v.indexOf(":"))
            v = v.substr(v.indexOf(":") + 1, v.length - v.indexOf(":") - 1)
            v = v.substr(v.indexOf(":") + 1, v.length - v.indexOf(":") - 1)
            v = v.substr(v.indexOf(":") + 1, v.length - v.indexOf(":") - 1)
            let error = v
            if (!program.compileinfo)
                program.compileinfo = new Array()
            program.compileinfo.push({
                "level": "Warning",
                "file": file,
                "line": parseInt(line),
                "msg": error,
                "marker": null
            })
        }
    }
    visual_info()
}

function clear_visual() {
    editor.setReadOnly(false)
    if (marker) {
        editor.session.removeMarker(marker)
        marker = null
    }
    if (last_row) {
        editor.session.removeGutterDecoration(last_row, "curMarker")
        last_row = null
    }
    $("#stack").children("*").remove()
    $("#globals").children(".item").remove()
}


// setInterval(() => {
//     if (state_var == STATE_PAUSE) {
//         refresh_globals()
//         refresh_editor()
//         refresh_stack()
//         for (let i = 0; i < program.framenum; i++)
//             updata_frame(program.frames[String(i)], String(i))
//     }
// }, 1000)