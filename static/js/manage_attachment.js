$("#manage_attachment").on('click', function() {
    $('#attach_manage').css("display", "flex")
    get_attachment_list()
})

$("#cancel-manage-attach").on('click', function() {
    $('#attach_manage').css("display", "none")
})

function get_attachment_list() {
    var form_data = new FormData();
    form_data.append("id", id)

    $.ajax({
        url: window.origin + '/main/ask_attachment_list',
        type: 'POST',
        dataType: "json",
        cache: false,
        contentType: false,
        processData: false,
        data: form_data,
        success: function(result) {
            $('#attach_list').children(".refresh_haha").remove()

            if (result) {
                let list = result["list"]
                if (list) {
                    for (let li of list) {

                        let arr = li
                        let item = $("<div class='example_item  refresh_haha' href='javascript:void(0)'>\
                        <div class='example_id'>" + arr["file_name"] + "</div>\
                        <div class='example_name'>" + arr["file_line"] + "</div>\
                        <div class='example_description'>" + arr["file_des"] + "</div>\
                        <button class='delete_button'></button>\
                    </div>")
                        $('#attach_list').append(item)
                    }
                    $('#attach_list').on("click", ".delete_button", function() {
                        let item = $(this).parent()
                        let name = item.find(".example_id").text()
                        let line = item.find(".example_name").text()
                        delete_attachment(name + line)
                    })
                }
            }
        },
    });

}

function delete_attachment(name) {
    socket.emit("delete_attachment", {
        "id": id,
        "name": name
    })
}

socket.on("delete_attachment_response", (data) => {
    if (data.status) {
        get_attachment_list()
    }
})