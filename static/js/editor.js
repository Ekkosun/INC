var curfile
var select_line = false
var ignore = false
var breakarray = new Map()
var map = new Map()
var bid = 1
var deletearray = []
var addarray = []
var editor = ace.edit("editor");
var marker
var last_row
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/c_cpp");
editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true,
});

editor.session.setUseWorker(true);
editor.setHighlightActiveLine(true);

editor.commands.addCommand({
    name: "Save",
    bindKey: {
        win: "Ctrl-s"
    },
    exec: () => {
        sessionStorage.setItem(curfile, editor.getValue())
        check()
        Upload(curfile, editor.getValue())
    },
});

var Range = ace.require('ace/range').Range;

editor.on("guttermousedown", function(e) {
    var target = e.domEvent.target;
    if (target.className.indexOf("ace_gutter-cell") == -1)
        return;
    var breakpoints = e.editor.session.getBreakpoints();
    var row = e.getDocumentPosition().row;
    if (typeof breakpoints[row] === typeof undefined) {
        // map[row + 1] = bid
        // bid = bid + 1
        e.editor.session.setBreakpoint(row)
            // addarray.push("5000-break-insert " + curfile + ":" + (row + 1))
    } else {
        e.editor.session.clearBreakpoint(row);
        deletearray.push("5001-break-delete " + (map[row + 1]))
    }
    breakarray.set(curfile, e.editor.session.getBreakpoints())
    e.stop();
})

function set_break() {
    if (!map.has("main")) {
        map.set("main", bid)
        addarray.push("5000-break-insert main")
        bid = bid + 1
    }
    for (let [k, v] of breakarray) {
        v.forEach((val, i) => {
            if (!map.has(k + (i + 1))) {
                map.set(k + (i + 1), bid)
                bid = bid + 1
                addarray.push("5000-break-insert " + k + ":" + (i + 1))
            }
        });
    }
}

editor.on("change", function(e) {
    if (ignore) {

    } else {
        let start = e.start.row
        let end = e.end.row
        let num = end - start
        let v = editor.session.getBreakpoints()
        let change = new Map()
        switch (e.action) {
            case "insert":
                v.forEach((val, i) => {
                    if (i > start)
                        change.set(i, i + num)

                })
                socket.emit("line_change", {
                    "id": id,
                    "file": curfile,
                    "start": start,
                    "num": num,
                })
                break;

            case "remove":
                v.forEach((val, i) => {
                    if (i > start) {
                        change.set(i, i - num)
                    }
                })
                socket.emit("line_change", {
                    "id": id,
                    "file": curfile,
                    "start": start,
                    "num": -num,
                })
                break;
        }
        for (let [k, v] of change) {
            editor.session.clearBreakpoint(k)
            editor.session.setBreakpoint(v)
        }
        breakarray.set(curfile, editor.session.getBreakpoints())
    }

})

function check() {


}