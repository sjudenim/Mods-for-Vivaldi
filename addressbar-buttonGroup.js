function windowButtonStyle() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
    #browser.win .window-buttongroup {
        top: 0;
        right: 0;
        z-index: 999
    }
    #browser.win .window-buttongroup button {
        height: 34px !important;
        width: 44px !important;
        opacity: .7
    }
    #browser.win .window-buttongroup button:hover {
        background-color: var(--colorAccentBgFadedMore) !important;
        fill: var(--colorAccentFg) !important
    }
    #browser.win .window-buttongroup button.window-minimize>svg path {
        d: path('M0 5h10v1H0z')
    }
    #browser.win .window-buttongroup button.window-maximize>svg path, #browser.win .window-buttongroup button.window-restore>svg path {
        d: path('M9 1v8H1V1h8m1-1H0v10h10V0z')
    }
    .maximized#browser.win .window-buttongroup button.window-close, .fullscreen#browser.win .window-buttongroup button.window-close {
        padding-right: 0 !important
    }
    #browser.win .window-buttongroup button.window-close svg path {
        d: path('M.71611758 0L0 .71414475 4.2868415 4.9990135.00197275 9.2838828l.71414483.7141446L5.0009863 5.7131583 9.2858555 10 10 9.2838828 5.715131 4.9990135 10 .71414475 9.2858555 0 5.0009863 4.2848688z')
    }
    #browser.win .window-buttongroup button.window-close, #browser.win:not(.win10) .window-buttongroup .window-close {
        background-color: transparent !important;
        fill: var(--colorFgIntenser) !important;
        margin-right: -2px !important;
        opacity: 1 !important
    }
    #browser.win .window-buttongroup button.window-close:hover, #browser.win:not(.win10) .window-buttongroup .window-close:hover {
        background-color: var(--colorHighlightBg) !important;
        fill: white !important
    }

    `;
    document.getElementsByTagName('head')[0].appendChild(style);
};

setTimeout(function wait() {
    const adrBar = document.querySelector('.toolbar.toolbar-addressbar');
    const windowButtons = document.querySelector('.window-buttongroup');
    if (windowButtons) {
        adrBar.appendChild(windowButtons);
        windowButtonStyle();
    } else {
        setTimeout(wait, 300);
    }
}, 300);
