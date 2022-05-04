$('#public').on('click', function() {
    $('#public_form').css("display", "flex")
})

$('#confirm-public').on('click', function() {
    let author = $("#example_author").val()
    $("#example_author").val("")
    let name = $("#example_name").val()
    $("#example_name").val("")
    let description = $("#example_description").val()
    $("#example_description").val("")
    public_example(author, name, description)
    $('#public_form').css("display", "none")
})

$('#cancle-public').on('click', function() {
    $('#public_form').css("display", "none")
})


socket.on("public_example_response", (data) => {
    let status = data["status"]
    let err = data["err"]
    if (!status)
        alert("public failed:" + err)
    else
        alert("public success!")
})

function public_example(author, name, description) {
    socket.emit("public_example", {
        "data": {
            "id": id,
            "author": author,
            "name": name,
            "description": description
        }
    })
}