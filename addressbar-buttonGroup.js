setTimeout(function wait() {
    const adrBar = document.querySelector('.toolbar.toolbar-addressbar');
    const windowButtons = document.querySelector('.window-buttongroup');
    if (windowButtons) {
        adrBar.appendChild(windowButtons);
    } else {
        setTimeout(wait, 300);
    }
}, 300);