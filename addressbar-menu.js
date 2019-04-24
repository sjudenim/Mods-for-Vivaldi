function menuStyle() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
	.vivaldi {
        top: 0;
        left: 0;
        z-index: 9999
    }
    #browser .vivaldi span.burger-icon svg path {
        d: path('M0 2.2000004v1h18v-1zm0 6v1h18v-1zM0 14.2v1h18v-1z')
    }
    #browser .vivaldi span.vivaldi-v,
    #browser .vivaldi span.burger-icon {
        height: 34px !important;
        width: 44px !important;
        padding: 6px 2px 0 4px !important;
        fill: var(--colorFg) !important;
        opacity: 1 !important
    }
    #browser .vivaldi span.vivaldi-v {
        padding: 7px 0 0 !important
    }
    #browser .vivaldi:hover span.vivaldi-v,
    #browser .vivaldi:active span.vivaldi-v,
    #browser .vivaldi:hover span.burger-icon,
    #browser .vivaldi:active span.burger-icon {
        background-color: var(--colorHighlightBg) !important;
        fill: white !important
    }
      
    #browser .vivaldi:hover span svg,
    #browser .vivaldi:focus span svg {
        transform: scale(1) !important
    }
      
    `;
    document.getElementsByTagName('head')[0].appendChild(style);
};

setTimeout(function wait() {
    const adrBar = document.querySelector('.toolbar.toolbar-addressbar');
    const menu = document.querySelector('.vivaldi');
    if (menu) {
        adrBar.insertBefore(menu, adrBar.firstChild);
        menuStyle();
    } else {
        setTimeout(wait, 300);
    }
}, 300);
