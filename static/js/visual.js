var stack = document.getElementById("stack")


function list_item(item, open) {
    let data = item.find('.value').first().text()
    let type = item.find('.type').first().text()
    let addr = item.attr("id")
    let element_size = SIZE_MAP.get(type)
    data = parser_array(data, type)
    let name = item.find('.name').text()
    if (item.children("ul").length <= 0) {
        list = $("<ul class='item_list'></ul>")
        for (i = 0; i < data.length; i++) {
            let id = element_size * (i) + parseInt(addr)
            id = "0x" + id.toString(16)
            let item_tmp = $("<li class='menu unselect' id='" + id + "'>" + "<div  class='name'>" + name + "[" + i + "]" + "</div>" + "<div class='value'>" + data[i] + "</div>" + "</div>")
            list.append(item_tmp)
        }
        item.append(list)
        item.children("ul").css("display", "none")
        item.children(".menu").addClass("havelist")

    } else {
        if (open == true)
            if (item.children("ul").css("display") == "none") {
                item.find("img").attr("src", "static/icon/collapse-all.svg")
                item.children("ul").css("display", "block")

            } else {
                item.find("img").attr("src", "static/icon/expand-all.svg")
                item.children("ul").css("display", "none")
            }
    }
}

function create_frame(func, id) {
    let frame = $("<div class='cards shadow-1' id=" + id + " >\
        <div class='tag unselect nolength'>" + func + "<a><img></a>" + "</div>\
        <div class='locals'>\
    </div>\
    </div>")
    $('#stack').append(frame)
        // frame.children(".locals").on('dblclick', ".item", function() {
        //     let data = $(this).find('.ptrorarray').text()
        //     if ($(this).find('.ptrorarray').text() == "") {
        //         return
        //     } else if ($(this).find('.ptrorarray').first().text() == "array") {
        //         list_item($(this), true)
        //     } else if ($(this).find('.ptrorarray').first().text() == "ptr") {
        //         list_pointer($(this))
        //     }
        // })
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

function startCompare(a, b, type) {

    var result = highlight(parser_array(a, type), parser_array(b, type));
    return result;
}

function distinct(arr) {
    var obj = {};
    var result = [];
    for (i = 0; i < arr.length; i++) {
        if (!obj[arr[i]]) {
            obj[arr[i]] = 1;
            result.push(arr[i]);
        }
    }
    return result;
};

function highlight() {
    var params = Array.prototype.slice.call(arguments);
    var result = params.map(function(e) {
        // e = e.toUpperCase();
        // e = e.replace(
        //     /[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g,
        //     "");
        return e //.split("");
    });
    var maxLen = eval(" Math.max(" + result.map(function(e) {
        return e.length
    }).join(",") + ")");
    result.forEach(function(e) {
        if (e.length < maxLen) {
            e.length = maxLen;
        };
    });
    var index = [];
    for (var i = 0; i < result[0].length; i++) {
        if (result[0][i] === result[1][i]) {
            continue;
        } else {
            index.push(i);
        }
    };

    index.forEach(function(e) {
        result[0][e] = "<span class='red'>" + (result[0][e] ? result[0][e] : "") + "</span>"
        result[1][e] = "<span class='red'>" + (result[1][e] ? result[1][e] : "") + "</span>"
    });
    return result
}

function update_var(dom, variable, isarg) {
    if (dom.children("#" + variable.addr).length > 0) {
        if (dom.children("#" + variable.addr).find('.ptrorarray').text() == "ptr") {
            let value = dom.children("#" + variable.addr).find('.value').first().text()
            if (value != variable.value) {
                dom.children("#" + variable.addr).find('.value').first().text(variable.value)
                dom.children("#" + variable.addr).children('.menu').addClass("change")
                dom.children("#" + variable.addr).removeClass("unused")
                dom.children("#" + variable.addr).find(".canzhi").remove()

            } else {
                // dom.children("#" + variable.name + variable.times).children('.menu').removeClass("change")
                dom.children("#" + variable.addr).removeClass("unused")
            }
            list_pointer(dom.children("#" + variable.addr))
                // dom.children("#" + variable.addr).children('.menu').removeClass("change")
        } else if (dom.children("#" + variable.addr).find('.ptrorarray').text() == "array") {
            let value = dom.children("#" + variable.addr).find('.value').first().text()
            if (value != variable.value) {
                let result = startCompare(value, variable.value, variable.type)
                let data = "{"
                for (let res of result[1])
                    data = data + res + ", "
                data = data.substring(0, data.length - 2) + "}"
                dom.children("#" + variable.addr).find('.value').first().html(data)
                    // dom.children("#" + variable.addr).children('.menu').addClass("change")
                dom.children("#" + variable.addr).removeClass("unused")
                dom.children("#" + variable.addr).find(".canzhi").remove()

            } else {
                dom.children("#" + variable.addr).find('.value').first().html(value)
                    // dom.children("#" + variable.addr).children('.menu').removeClass("change")
                dom.children("#" + variable.addr).removeClass("unused")
            }
            // setTimeout(() => {

            //     dom.children("#" + variable.addr).find("img").attr("src", "static/icon/expand-all.svg")
            //     list_item(item, false)
            //     dom.children("#" + variable.addr).find("img").off()
            //     dom.children("#" + variable.addr).find("img").on("click", () => {
            //         list_item(dom.children("#" + variable.addr), true)
            //     })
            //     dom.children("#" + variable.addr).on("dblclick", () => {
            //         list_item(dom.children("#" + variable.addr), true)
            //     })
            // }, 500)
            updata_list(dom.children("#" + variable.addr))

            // list_item(dom.children("#" + variable.addr), false)
            // dom.children("#" + variable.addr).children('.menu').removeClass("change")
        } else {
            let value = dom.children("#" + variable.addr).find('.value').first().text()
            if (value != variable.value) {
                dom.children("#" + variable.addr).find('.value').first().text(variable.value)
                dom.children("#" + variable.addr).children('.menu').addClass("change")
                dom.children("#" + variable.addr).removeClass("unused")
                dom.children("#" + variable.addr).find(".canzhi").remove()

            } else {
                // dom.children("#" + variable.addr).children('.menu').removeClass("change")
                dom.children("#" + variable.addr).removeClass("unused")
            }
        }
        // if (dom.children("#" + variable.name+i).children(".item_list").length 

    } else {
        let item = $("<div " + "id=" + variable.addr + " class='item'>" + "<div class='menu unselect'>" + "<div class='ptrorarray'>" + variable.is + "</div>" + "<div class='type'>" + variable.type + "</div>" + "<div class='name'>" + variable.name + "</div> " + "<div class = 'value'>" + variable.value + "</div>" + "<div class = 'canzhi'>" + "残值" + "</div>" + "<div class = 'to'>" + "" + "</div>" + "<a><img></a>" + "</div> " + "</div> ")
        if (dom.attr("id") == "globals" || isarg == true) {
            item.find(".canzhi").remove()
        }
        dom.append(item)
        if (variable.is == "ptr") {
            list_pointer(item)
        } else if (variable.is == "array") {
            item.find("img").attr("src", "static/icon/expand-all.svg")
            list_item(item, false)
            item.find("img").off()
            item.find("img").on("click", () => {
                list_item(item, true)
            })
            item.on("dblclick", () => {
                list_item(item, true)
            })
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
            for (let i = frame.arg.length - 1; i >= 0; i--) {
                let type = ""
                let arg = frame.arg[i]
                if (arg.type.indexOf("*") != -1)
                    type = "ptr"
                else if (arg.type.indexOf("[") != -1)
                    type = "array"
                let tmp = {
                    "is": type,
                    "name": arg.name,
                    "value": arg.value.split(" <")[0],
                    "type": arg.type.split(" *")[0],
                    "times": 0,
                    "addr": "0y" + i + arg.name
                }

                update_var(stack.children("#" + id).children(".locals"), tmp, true)
            }
        stack.children("#" + id).find(".unused").remove()

        let domlist = stack.children("#" + id).children(".locals").children(".item").get()
        domlist.sort(function(a, b) {
            var a_v = $(a).attr("id")
            var b_v = $(b).attr("id")
            if (a_v > b_v)
                return 1
            else
                return -1
        })
        stack.children("#" + id).children(".locals").html(domlist)
        for (let i = 0; i < domlist.length; i++) {
            if ($(domlist[i]).find(".ptrorarray").text() == "array") {
                let item = $(domlist[i])
                item.find("img").attr("src", "static/icon/expand-all.svg")
                list_item(item, false)
                item.find("img").off()
                item.find("img").on("click", () => {
                    list_item(item, true)
                })
                item.on("dblclick", () => {
                    list_item(item, true)
                })
            }
        }
    } else {
        if (frame)
            if (frame.locals)
                for (let i = 0; i < frame.locals.length; i++) {
                    update_var(stack.children("#" + id).children(".locals"), frame.locals[i])
                }
        let domlist = stack.children("#" + id).children(".locals").children(".item").get()
        domlist.sort(function(a, b) {
            var a_v = $(a).attr("id")
            var b_v = $(b).attr("id")
            if (a_v > b_v)
                return 1
            else
                return -1
        })
        stack.children("#" + id).children(".locals").html(domlist)
        for (let i = 0; i < domlist.length; i++) {
            if ($(domlist[i]).find(".ptrorarray").text() == "array") {
                let item = $(domlist[i])
                item.find("img").attr("src", "static/icon/expand-all.svg")
                list_item(item, false)
                item.find("img").off()
                item.find("img").on("click", () => {
                    list_item(item, true)
                })
                item.on("dblclick", () => {
                    list_item(item, true)
                })
            }
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
    for (let [k, v] of point_color) {
        for (let i in v[1]) {
            if (v[1][i] == domid && ptr != k) {
                v[1].splice(i, 1)
                point_color.set(k, v)
                if ($("#" + k).length > 0) {
                    let to = $("#" + k).find(".name")
                    if (to.length > 1) {
                        to = $("#" + k).find("#" + k).find(".name").text()
                        $("#" + k).find("#" + k).css("background-color", "#888a90")
                    } else {
                        $("#" + k).children(".menu").css("background-color", "#888a90")
                        to = $("#" + k).find(".name").text()
                    }
                }
            }
        }
    }
    if (ptr == "0x0") {
        dom.children(".menu").find(".to").text("NULL")
        dom.children(".menu").css("background-color", "green")
        dom.children(".menu").css("color", "black")
        return
    }
    let type = dom.children(".menu").find(".type").text()

    if ($("#" + ptr).length > 0) {
        if (!point_color.has(ptr)) {
            let color = randomColor()
            point_color.set(ptr, [color, []])
        }
        dom.children(".menu").css("background-color", point_color.get(ptr)[0])
        let have = false
        for (let v of point_color.get(ptr)[1]) {
            if (v == domid)
                have = true

        }
        if (!have)
            point_color.get(ptr)[1].push(domid)

        dom.children(".menu").addClass("point")
        let to = $("#" + ptr).find(".name")
        if (to.length > 1) {
            to = $("#" + ptr).find("#" + ptr).find(".name").text()
            $("#" + ptr).find("#" + ptr).css("background-color", point_color.get(ptr)[0])
        } else {
            $("#" + ptr).children(".menu").css("background-color", point_color.get(ptr)[0])
            to = $("#" + ptr).find(".name").text()
        }
        dom.children(".menu").find(".to").text("=>" + to)
        dom.children(".menu").css("color", "black")

    } else {
        dom.children(".menu").css("background-color", "yellow")
        dom.children(".menu").find(".to").text("野指针")
        dom.children(".menu").css("color", "black")
    }
    // $("#" + item).children(".menu").css("background-color", "blue")

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

function refresh_point() {
    for (let [k, v] of point_color) {
        for (let val in v[1])
            if ($("#" + v[1][val]).length > 0) {
                list_pointer($("#" + v[1][val]))
            } else {
                let ptr = k
                if ($("#" + ptr).length > 0) {
                    let to = $("#" + ptr).find(".name")
                    if (to.length > 1) {
                        to = $("#" + ptr).find("#" + ptr).find(".name").text()
                        $("#" + ptr).find("#" + ptr).css("background-color", "#888a90")
                    } else {
                        $("#" + ptr).children(".menu").css("background-color", "#888a90")
                        to = $("#" + ptr).find(".name").text()
                    }
                }
            }
    }
}

function sort_locals() {
    stack = $('#stack')
    for (let id = 0; id < program.framenum; id++) {
        let domlist = stack.children("#" + id).children(".locals").children(".item").get()
        let sorted = true
        for (let i = 0; i < domlist.length - 1; i++) {
            if (domlist[i] < domlist[i + 1]) {
                sorted = false
                break
            }
        }
        if (!sorted) {
            domlist.sort(function(a, b) {
                var a_v = $(a).attr("id")
                var b_v = $(b).attr("id")
                if (a_v > b_v)
                    return 1
                else
                    return -1
            })
            stack.children("#" + id).children(".locals").html(domlist)
            for (let i = 0; i < domlist.length; i++) {
                if ($(domlist[i]).find(".ptrorarray").text() == "array") {
                    let item = $(domlist[i])
                    item.find("img").attr("src", "static/icon/expand-all.svg")
                    list_item(item, false)
                    item.find("img").off()
                    item.find("img").on("click", () => {
                        list_item(item, true)
                    })
                    item.on("dblclick", () => {
                        list_item(item, true)
                    })
                }
            }
        }
    }
}
setInterval(() => {
    refresh_point()
    sort_locals()
}, 100)