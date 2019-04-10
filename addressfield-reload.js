setTimeout(function wait() {
    const adrField = document.querySelector('.addressfield');
    const reload = document.querySelector('.button-toolbar.reload');
    if (reload != null) {
        adrField.appendChild(reload);
    } else {
        setTimeout(wait, 100);
    }
}, 100);
