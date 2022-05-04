var oDragWrap = document.body;

$(function() {

    $('#file_tree').jstree({
        "types": {
            "dir": {
                "icon": window.origin + "/static/icon/dir.svg"
            },
            ".c": {
                "icon": window.origin + "/static/icon/file.svg"
            }
        },
        'core': {
            'check_callback': true,
            'themes': {
                'name': 'proton',
                'responsive': true
            },
            'data': {
                "url": window.origin + "/main/get_dir?id=" + id,
                "dataType": "json"
            },
        },
        "plugins": ["contextmenu", "types"],
    });
});


$('#file_tree').on("select_node.jstree", (e, data) => {
    if (data.node.type === "dir")
        return
    editor.session.clearBreakpoints()
    $("#compileinfo").find(".info").remove()
    if (program.compileinfo)
        for (v of program.compileinfo) {
            if (v.marker)
                editor.session.removeMarker(v.marker)
            v.marker = null
        }
    curfile = data.node.text
    if (breakarray[curfile]) {
        breakarray[curfile].forEach((v, i) => {
            editor.session.setBreakpoint(i)
        });
    }
    content = sessionStorage.getItem(curfile)
    if (content)
        editor.setValue(content, 1)
    else
        editor.setValue("", 1)
    visual_info()
})

$('#file_tree').on("create_node.jstree", (e, data) => {
    curfile = data.node.text
    data.node.type = ".c"
    sessionStorage.setItem(curfile, "")
    Upload(curfile, "")
    refresh_tree()
})

$('#file_tree').on("rename_node.jstree", (e, data) => {
    curfile = data.text
    let old = data.old
    if (data.node.type === "dir")
        return
    content = sessionStorage.getItem(old)
    sessionStorage.removeItem(old)
    if (content) {
        sessionStorage.setItem(curfile, content)
        editor.setValue(content)
    } else {
        editor.setValue("")
        sessionStorage.setItem(curfile, "")
    }
    remove_file(old)
    Upload(curfile, content)
})

$('#file_tree').on("delete_node.jstree", (e, data) => {
    let file = data.node.text
    sessionStorage.removeItem(file)
    remove_file(file)
    refresh_tree()
})

$('#file_tree').on("loaded.jstree", (e, data) => {
    setTimeout(() => {
        select(curfile)
    }, 1000)
})

function Upload(filename, data) {
    var form_data = new FormData();

    var file_data = sessionStorage.getItem(filename);
    form_data = {
        "id": id,
        "name": filename,
        "data": data
    }

    $.ajax({
        url: window.origin + '/main/upload_file',
        type: 'POST',
        data: form_data,
        success: () => {
            refresh_tree()
        }
    });
}




oDragWrap.addEventListener(
    "dragenter",
    function(e) {
        e.preventDefault()
    },
    false
);


oDragWrap.addEventListener(
    "dragleave",
    function(e) {
        e.preventDefault()
    },
    false
);



oDragWrap.addEventListener(
    "dragover",
    function(e) {
        e.preventDefault()
    },
    false
);

//扔
oDragWrap.addEventListener(
    "drop",
    function(e) {
        e.preventDefault()
        dropHandler(e)
    },
    false
);

var dropHandler = function(e) {
    e.preventDefault();

    var fileList = e.dataTransfer.files;

    if (fileList.length == 0) {
        return;
    }

    var filename = fileList[0].name


    var reader = new FileReader();


    reader.onload = function(e) {
        sessionStorage.setItem(filename, this.result)
        Upload(filename, this.result)

    };
    reader.readAsText(fileList[0])
};

function refresh_tree() {
    let url = window.origin + "/main/get_dir?id=" + id
    $.get(url, (data) => {
        $('#file_tree').jstree(true).settings.core.data = data
        $('#file_tree').jstree(true).refresh()
    }, "json")
}

function remove_file(filename) {
    let url = window.origin + "/main/remove_file?id=" + id + "&filename=" + filename
    $.get(url, (data) => {}, "json")
    editor.session.setValue("", 1)
}

function select(name) {
    $('#file_tree').jstree(true).select_node(name)
}

function deselect(name) {
    $('#file_tree').jstree(true).deselect_node(name)
}