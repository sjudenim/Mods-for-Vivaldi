function reloadStyle() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
    .toolbar .button-toolbar.reload {
        order: 8;
        fill: var(--colorFgFaded) !important;
        margin-top: -3px
    }
    .toolbar .button-toolbar.reload svg {
        flex: 0 0 20px !important;
        width: 20px !important;
        height: 20px !important
    }
      
    `;
    document.getElementsByTagName('head')[0].appendChild(style);
};

setTimeout(function wait() {
    const adrField = document.querySelector('.addressfield');
    const reload = document.querySelector('.button-toolbar.reload');
    if (reload) {
        adrField.appendChild(reload);
        reloadStyle();
    } else {
        setTimeout(wait, 300);
    }
}, 300);
