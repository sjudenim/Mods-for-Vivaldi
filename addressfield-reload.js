function reloadStyle() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
    .toolbar .button-toolbar.reload {
        order: 1;
        fill: var(--colorFgFaded) !important;
        margin-top: 3px
    }
    .toolbar .button-toolbar.reload svg {
        flex: 0 0 22px !important;
        width: 22px !important;
        height: 22px !important;
        opacity: .7
    }
    .toolbar .button-toolbar.reload svg path {d: path('M15.497 5.925L15.5.938l-1.986 1.985-.217-.227A7.455 7.455 0 007.997.5C3.866.5.5 3.867.5 8c0 4.135 3.366 7.5 7.497 7.5 4.134 0 7.497-3.365 7.497-7.5h-1.453a6.048 6.048 0 01-6.044 6.047A6.051 6.051 0 011.952 8a6.05 6.05 0 016.045-6.044 6 6 0 014.274 1.768l.217.224-1.975 1.978h4.984z')}

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
