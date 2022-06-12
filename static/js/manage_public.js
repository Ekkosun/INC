$("#manage_public").on('click', () => {
    $("#manage").css("display", "flex")
    get_my_public()
})


$('#cancel-manage').on('click', function() {
    $('#manage').css("display", "none")
})

function get_my_public() {
    socket.emit("get_my_public", {
        "id": id
    })
}

socket.on("get_my_public_response", (data) => {
    $('#manage_list').children(".refresh_haha").remove()
    let list = data["list"]
    if (list) {
        for (let li of list) {
            let arr = li.split(" ")
            let item = $("<div class='example_item  refresh_haha' href='javascript:void(0)'>\
            <div class='example_id'>" + arr[0] + "</div>\
            <div class='example_name'>" + arr[1] + "</div>\
            <div class='example_description'>" + arr[2] + "</div>\
            <button class='delete_button'></button>\
        </div>")
            $('#manage_list').append(item)
        }
        $('#manage_list').on("click", ".delete_button", function() {
            let item = $(this).parent()
            let name = item.find(".example_name").text()
            delete_my_public(name)
        })
    }
})

function delete_my_public(name) {
    socket.emit("delete_my_public", {
        "id": id,
        "name": name
    })
}

socket.on("delete_my_public_response", (data) => {
    if (data.status) {
        get_my_public()
    }
})