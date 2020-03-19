/*
* Vivaldi Button Group
* Written by sjudenim
* GNU General Public License v3.0
* 
*  Moves the button group (minimize, restore, close) to the end of addressbar
*/

setTimeout(function wait() {
    const adrBar = document.querySelector('.toolbar.toolbar-addressbar');
    const windowButtons = document.querySelector('.window-buttongroup');
    if (windowButtons) {
        adrBar.appendChild(windowButtons);
    } else {
        setTimeout(wait, 300);
    }
}, 300);
