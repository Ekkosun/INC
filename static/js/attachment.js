let attachment = {}
let rec
let rec_blob
let timeout_id_attachment
$('#attach_file').on('click', () => {
    $('#attach').css("display", "flex")
    $("#rec_audio").children("audio").remove()
    timeout_id_attachment = setInterval(() => {
        let line = String(editor.getCursorPosition().row + 1)
        let file = curfile
        attachment.filename = $('#attach_code_file').val(file)
        attachment.fileline = $('#attach_line').val(line)
    }, 100)
    $('#attach_des').val("请填写对于附件的描述")
})


$('#attach_submit').on('click', (e) => {
    e.preventDefault()
    attachment.filename = $('#attach_code_file').val()
    $('#attach_code_file').val("")
    attachment.fileline = $('#attach_line').val()
    $('#attach_line').val("")
    attachment.filedes = $('#attach_des').val()
    $('#attach_des').val("")
    if ($('#attachment').val() != "") {
        uploade_attachment()
        $('#attach').css("display", "none")
    } else if (rec_blob) {
        upload_rec()
        $('#attach').css("display", "none")
    } else {
        alert("请选择文件或者录音!")
    }
    if (attachment.filedes == "") {
        alert("请填写附件的描述")
    }
})

$('#attach_cancel').on('click', () => {
    clearInterval(timeout_id_attachment)
    $('#attach').css("display", "none")
})


function uploade_attachment() {
    var form_data = new FormData();

    form_data.append("name", attachment.filename)
    form_data.append("line", attachment.fileline)
    form_data.append("id", id)
    form_data.append("file", attachment.data)
    form_data.append("des", attachment.filedes)
    $.ajax({
        url: window.origin + '/main/upload_attachment',
        type: 'POST',
        dataType: "json",
        cache: false,
        contentType: false,
        processData: false,
        data: form_data,
        success: function() {

        }
    });
}

function text_attachment_show(text) {
    let item = $("<p>" + text + "</p>")
    $("#show_attachment").empty()
    $("#show_attachment").append(item)
}

function img_attachment_show(file, line) {
    let img = $("<img>")
    $("#show_attachment").empty()
    img.attr("src", `${window.origin}/main/attachment/${id}/${file+line}`)
    $("#show_attachment").append(img)

}

function audio_attachment_show(file, line) {
    let audio = $("<audio\
        controls\
    </audio>")
    $("#show_attachment").empty()
    audio.attr("src", `${window.origin}/main/attachment/${id}/${file+line}`)
    $("#show_attachment").append(audio)
}

function video_attachment_show(file, line) {
    let video = $("<video\
        controls\
    </video>")
    $("#show_attachment").empty()
    video.attr("src", `${window.origin}/main/attachment/${id}/${file+line}`)
    $("#show_attachment").append(video)
}

function if_have_attachment(file, line) {
    var form_data = new FormData();

    form_data.append("name", file)
    form_data.append("line", line)
    form_data.append("id", id)

    $.ajax({
        url: window.origin + '/main/ask_attachment',
        type: 'POST',
        dataType: "json",
        cache: false,
        contentType: false,
        processData: false,
        data: form_data,
        success: function(result) {
            if (result.is) {
                if (result.data != "") {
                    text_attachment_show(result.data)
                } else if (result.type.indexOf("image") != -1) {
                    img_attachment_show(file, line)
                } else if (result.type.indexOf("audio") != -1) {
                    audio_attachment_show(file, line)
                } else if (result.type.indexOf("video") != -1) {
                    video_attachment_show(file, line)
                }
            } else {
                text_attachment_show("no attachment")
            }
        },
    });
}

$('#attachment').on('change', (e) => {
    let fileList = e.target.files
    console.log(fileList)
    if (fileList.length == 0) {
        return;
    }
    attachment.name = fileList[0].name
        // var reader = new FileReader();

    attachment.data = fileList[0]
        // reader.onload = function(e) {
        //     attachment.data = this.result
        // };
        // reader.readAsDataURL(fileList[0])

})

$("#start_rec").on("click", () => {
    rec = Recorder();

    rec.open(function() {
        rec.start();
    }, function(msg, isUserNotAllow) {
        alert((isUserNotAllow ? "用户拒绝了权限，" : "") + "无法录音:" + msg);
    });

})


$("#end_rec").on("click", () => {
    rec.stop(function(blob, duration) {
        rec_blob = blob
        let audio = $("<audio\
        controls\
    </audio>")
        audio.attr("src", URL.createObjectURL(blob))
        $("#rec_audio").append(audio)
        audio.css("height", "40px")
        rec.close()
    }, function(msg) {
        alert("录音失败:" + msg);
    });

})

function upload_rec() {
    var form_data = new FormData();

    form_data.append("name", attachment.filename)
    form_data.append("line", attachment.fileline)
    form_data.append("des", attachment.filedes)
    form_data.append("id", id)
    form_data.append("file", rec_blob, "recorder.mp3")
    $.ajax({
        url: window.origin + '/main/upload_attachment',
        type: 'POST',
        dataType: "json",
        cache: false,
        contentType: false,
        processData: false,
        data: form_data,
    });
}