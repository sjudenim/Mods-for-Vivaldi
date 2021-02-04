//
//  Vivaldi Status-bar mod (updated for browser version 3.4)
//  Written by leutage and sjudenim
//  GNU General Public License v3.0
//
//  This mod moves the status bar and makes it a part of the adress bar. It's positioning is right of a centered addressfield 
//  Centered addressfield can be found here, https://github.com/sjudenim/Mods-for-Vivaldi/blob/master/addressbar-tweaks.css
// 
//
(function () {

    function statusToggle() {
        const statusContainer = document.getElementById('statusContainer');
        if (statusContainer.style.display === 'block') {
            statusContainer.style.display = 'none';
            statusButton.classList.remove('active');
        }
        else {
            statusButton.classList.add('active');
            statusContainer.style.display = 'block';
        }
    };

    function statusStyle() {
        const style = document.createElement('style');
        style.id = 'statusDropdown';
        style.innerHTML = `
        #browser.address-off #statusButton { display: none; }
        #statusToggle { position: fixed; left: calc(50vw + 22.5vw + 2px) !important; margin-top: 34px; }
        #statusToggle:hover { background-color: var(--colorHighlightBgAlpha) !important; fill: var(--colorAccentFg); }
        #statusButton.active svg { fill: var(--colorHighlightBg); !important; }
        #statusContainer { position: fixed; z-index: 1; left: calc(50vw + 22.5vw + 34px); top: 0; }
        .toolbar-statusbar .button-toolbar > button:hover, .toolbar-statusbar .button-toolbar > button.button-pressed { background-color: transparent !important; fill: var(--colorHighlightBg); }
        .toolbar-statusbar > .button-toolbar > button { padding-top: 1px !important; }
        .toolbar-statusbar .button-toolbar > button:hover, .toolbar-statusbar .button-toolbar > button.button-pressed { background-color: transparent !important; fill: var(--colorHighlightBg); }
        .toolbar-statusbar { border: none; box-shadow: none !important; background-color: transparent !important; margin-top: 5px; padding: 0 4px; }
        .button-popup { bottom: unset !important; top: 32px; border-radius: 3px; }
        .button-popup-above.button-popup-arrow-light:before, .button-popup-above.button-popup-arrow-dark:before { transform: rotate(180deg); bottom: unset !important; top: -16px; }
        .button-popup-above.button-popup-arrow-light:before { border-top-color: var(--colorBg); }
        .button-popup .button-popup-wrapper { height: fit-content; }
        .button-popup h2 { text-align: center }
        .button-popup-wrapper { background-color: var(--colorBgDark); }
        .button-toolbar > button > span + .button-title, .button-toolbar > button.button-textonly { padding-top: 2px }
        /* Status info overlay */
        .StatusInfo { visibility: hidden; position: fixed; left: 8px; bottom: 2px; overflow: hidden; pointer-events: none; }
        .StatusInfo--Visible .StatusInfo-Content { visibility: visible; background-color: var(--colorAccentBg); backdrop-filter: blur(10px); opacity: .9; padding: 4px 7px; border-radius: 2px;}
    `;
        document.getElementsByTagName('head')[0].appendChild(style);
    };
    
    function statusDropdown() {
        if (!document.getElementById('statusDropdown')) {
            statusStyle();
        }
        const toolBar = document.querySelector('.toolbar-mainbar');
        const button = document.createElement('div');
        button.id = 'statusButton';
        button.classList.add('button-toolbar');
        button.setAttribute('title', 'Toggle status bar');
        button.innerHTML = '<button id="statusToggle" tabindex="-1"><svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg"><path d="M10.513 8L10 8.469 14.973 13 10 17.531l.513.469L16 13z"></path></button>';
        toolBar.appendChild(button);
        const container = document.createElement('div');
        container.id = 'statusContainer';
        container.style.display = 'none';
        toolBar.appendChild(container);
        document.getElementById('statusToggle').addEventListener('click', statusToggle);
    };
    
    var appendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function () {
        if (arguments[0].tagName === 'BUTTON') {
            setTimeout(function() {
                if (this.classList.contains('profile-popup')) {
                    const statusButton = document.getElementById('statusButton');
                    const toolBar = document.querySelector('.toolbar-mainbar')
                    if (statusButton) {
                        toolBar.insertBefore(this, statusButton);
                    }
                }
            }.bind(this, arguments[0]));
        }
        if (arguments[0].tagName === 'DIV') {
            setTimeout(function() {
                if (this.classList.contains('toolbar-statusbar')) {
                    const statusContainer = document.getElementById('statusContainer');
                    if (!statusContainer) {
                        statusDropdown();
                    }
                    if (statusContainer && !document.getElementById('statusInfoToggle')) {
                        statusContainer.appendChild(document.querySelector('.toolbar-statusbar'));
                        statusMod();
                    }
                }
            }.bind(this, arguments[0]));
        }
        return appendChild.apply(this, arguments);
    };
    
    var removeChild = Element.prototype.removeChild;
    Element.prototype.removeChild = function () {
        if (arguments[0].tagName === 'DIV' && arguments[0].classList.contains('toolbar-statusbar')) {
            const statusButton = document.getElementById('statusButton');
            const statusContainer = document.getElementById('statusContainer');
            statusButton.remove();
            statusContainer.remove();
        }
        else {
            return removeChild.apply(this, arguments);
        }
    };
    })();