setTimeout(function wait() {
    const adrBar = document.querySelector('.toolbar.toolbar-addressbar');
    const menu = document.querySelector('.vivaldi');
    if (menu != null) {
        adrBar.insertBefore(menu, adrBar.firstChild);
    } else {
        setTimeout(wait, 100);
    }
}, 100);
