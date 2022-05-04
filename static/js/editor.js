var curfile
var breakarray = {}
var map = {}
var bid = 2
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
        map[row + 1] = bid
        bid = bid + 1
        e.editor.session.setBreakpoint(row)
        addarray.push("5000-break-insert " + curfile + ":" + (row + 1))
    } else {
        e.editor.session.clearBreakpoint(row);
        deletearray.push("5001-break-delete " + (map[row + 1]))
    }
    breakarray[curfile] = e.editor.session.getBreakpoints()
    e.stop();
})


function check() {


}