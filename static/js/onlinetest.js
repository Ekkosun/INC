$('#online-test').on('click', () => {
    let url = window.origin
    let u = url.substring(0, url.length - 1)
    u = u + "1"
    window.open(u)
})