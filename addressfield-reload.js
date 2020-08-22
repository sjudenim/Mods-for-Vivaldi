/*
* Vivaldi Addressfield Reload
* Written by sjudenim
* GNU General Public License v3.0
* 
* Moves the reload button to the end of the addressfield
* Replaces icon
*/

function reloadStyle() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
    .toolbar .button-toolbar.reload { order: 1 }
    .toolbar .button-toolbar.reload svg { flex: 0 0 22px !important; width: 22px !important; height: 22px !important; margin-left: 4px; margin-top: 8px; }
    .toolbar .button-toolbar > button[title="Reload current page"] svg path { d: path('M14.997 6.063L15 1.409l-1.854 1.852-.203-.211A6.953 6.953 0 007.997 1C4.142 1 1 4.143 1 8c0 3.859 3.142 7 6.997 7 3.858 0 6.997-3.141 6.997-7h-1.355a5.647 5.647 0 01-5.642 5.645A5.648 5.648 0 012.355 8a5.647 5.647 0 015.642-5.641 5.6 5.6 0 013.989 1.65l.203.208-1.844 1.847 4.652-.001z') }
    .toolbar .button-toolbar > button[title="Stop"] svg path { d: path('M14 2.929L13.07 2 8 7.071 2.929 2 2 2.929 7.071 8 2 13.07l.929.93L8 8.93 13.07 14l.93-.932L8.932 8z') }
    `;
    document.getElementsByTagName('head')[0].appendChild(style);
};

setTimeout(function wait() {
    const adrField = document.querySelector('.toolbar-small.toolbar-insideinput');
    const reload = document.querySelector('.button-toolbar.reload');
    if (reload) {
        adrField.appendChild(reload);
        reloadStyle();
    } else {
        setTimeout(wait, 300);
    }
}, 300);
