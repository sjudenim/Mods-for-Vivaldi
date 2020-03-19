/*
* Vivaldi Menu button
* Written by sjudenim
* GNU General Public License v3.0
* 
*  Moves the menu button to the beginning of the addressbar
*/

function menuStyle() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
	.vivaldi {
        top: 0;
        left: 0;
        height: 34px !important;
        width: 40px !important;
        fill: var(--colorFg) !important;
        opacity: 1 !important;
        z-index: 9999
    }
    #browser .vivaldi span.burger-icon svg path {
        d: path('M0 2.2000004v1h18v-1zm0 6v1h18v-1zM0 14.2v1h18v-1z')
    }
    #browser .vivaldi span.burger-icon {
        padding: 3px 2px 0 3px !important
    }
    #browser .vivaldi:hover,
    #browser .vivaldi:active {
        background-color: var(--colorHighlightBg) !important;
        fill: white !important
    }
    #browser .vivaldi:hover span svg {
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
