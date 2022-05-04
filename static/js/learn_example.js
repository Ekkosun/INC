$("#learn").on('click', function() {
    $('#example').css("display", "flex")
    get_example_list()
})

$('#cancle-learn').on('click', function() {
    $('#example').css("display", "none")
})

$('#example_list').on('click', "a", function() {
    let id = $(this).children(".example_id").text()
    let name = $(this).children(".example_name").text()
    get_path(id, name)
})

function get_example_list() {
    socket.emit("get_example_list")
}

function get_path(author_id, name) {
    socket.emit("get_path", {
        "author_id": author_id,
        "id": id,
        "name": name
    })
}

socket.on("get_path_response", (data) => {
    PullFile(data["path"])
    refresh_tree()
})

socket.on("example_list", (data) => {
    $('#example_list').children("a").remove()
    let list = data["list"]
    if (list) {
        for (let li of list) {
            let arr = li.split(" ")
            let item = $("<a class='example_item selection' href='javascript:void(0)'>\
            <div class='example_id'>" + arr[0] + "</div>\
            <div class='example_name'>" + arr[1] + "</div>\
            <div class='example_description'>" + arr[2] + "</div>\
        </a>")
            $('#example_list').append(item)
        }
    }
})