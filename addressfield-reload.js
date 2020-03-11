function reloadStyle() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
    .toolbar .button-toolbar.reload {
        order: 1;
        margin-top: 3px
    }
    .toolbar .button-toolbar.reload svg {
        flex: 0 0 22px !important;
        width: 22px !important;
        height: 22px !important;
    }
    .toolbar .button-toolbar > button[title="Reload current page"] svg path {d: path('M15.247 5.994l.003-4.82-1.92 1.918-.21-.219A7.204 7.204 0 007.997.75C4.004.75.75 4.005.75 8c0 3.997 3.254 7.25 7.247 7.25 3.996 0 7.247-3.253 7.247-7.25H13.84a5.847 5.847 0 01-5.843 5.845A5.849 5.849 0 012.154 8a5.849 5.849 0 015.843-5.843c1.561 0 3.027.605 4.132 1.709l.21.216-1.909 1.913 4.817-.001z')}

    .toolbar .button-toolbar > button[title="Stop"] svg path {d: path('M14.5 2.507L13.493 1.5 8 6.993 2.507 1.5 1.5 2.507 6.993 8 1.5 13.493 2.507 14.5 8 9.007l5.493 5.493 1.007-1.01L9.01 8z')}
    
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
