setTimeout(function wait() {
    const adrfield = document.querySelector('.addressfield');
    const reload = document.querySelector('.button-toolbar.reload');
    if (reload != null) {
        adrfield.appendChild(reload);
    } else {
        setTimeout(wait, 300);
    }
}, 300);