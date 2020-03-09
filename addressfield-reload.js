function reloadStyle() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
    .toolbar .button-toolbar.reload {
        order: 1;
        fill: var(--colorFgFaded) !important;
        margin-top: -1px
    }
    .toolbar .button-toolbar.reload svg {
        flex: 0 0 21px !important;
        width: 21px !important;
        height: 21px !important
    }
      
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
