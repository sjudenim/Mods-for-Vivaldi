function moveElements() {
    const menu = document.querySelector('.vivaldi');
    const buttongroup = document.querySelector('.window-buttongroup');
    adr.insertBefore(menu, adr.firstChild);
    adr.appendChild(buttongroup);
};

let adr = {};
setTimeout(function wait() {
    adr = document.querySelector('.toolbar-addressbar.toolbar');
    if (adr) {
        moveElements();
    } else {
        setTimeout(wait, 300);
    }
}, 300);