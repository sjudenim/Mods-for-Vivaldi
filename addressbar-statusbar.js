/*
* Vivaldi Status-bar mod (updated for browser version 3.4)
* Written by leutage and sjudenim
* GNU General Public License v3.0
*
* This mod moves the status bar and makes it a part of the adress bar. It's positioning is based on a centered addressfield 
* Centered addressfield can be found here, https://github.com/sjudenim/Mods-for-Vivaldi/blob/master/addressbar-tweaks.css
* 
*/

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
        style.type = 'text/css';
        style.id = 'statusDropdown';
        style.innerHTML = `
        #browser.address-off #statusButton { display: none; }
        #statusToggle { position: absolute; right: calc(50vw + 22.5vw - 3px); margin-top: 34px; }
        #statusToggle:hover { background-color: var(--colorHighlightBgAlpha) !important; fill: var(--colorAccentFg); }
        #statusButton.active svg { fill: var(--colorHighlightBg); !important; }
        #statusContainer { position: absolute; z-index: 1; right: calc(50vw + 22.5vw + 30px); top: 0; }
        .toolbar-statusbar > .button-toolbar > button { padding-top: 1px !important; }
        .toolbar-statusbar .button-toolbar > button:hover, .toolbar-statusbar .button-toolbar > button.button-pressed { background-color: transparent !important; fill: var(--colorHighlightBg); }
        .toolbar-statusbar { border: none; box-shadow: none !important; background-color: transparent !important; margin-top: 5px; padding: 0 4px; }
        .button-popup.button-popup-above:after { border-top-color: var(--colorBgDark); }
        .button-popup { bottom: unset !important; top: 32px; border-radius: 3px; }
        .button-popup-above.button-popup-arrow-light:before, .button-popup-above.button-popup-arrow-dark:before { transform: rotate(180deg); bottom: unset; }
        .button-popup-arrow--light:before { border-top-color: var(--colorBg); border-bottom-color: var(--colorBg); }
        .button-popup-arrow--light--above:after { border-top-color: var(--colorBgDark); border-top: 10px solid var(--colorBgDark); }
        .button-popup .button-popup-wrapper { height: fit-content; }
        .button-popup h2 { text-align: center }
        .button-popup-wrapper { background-color: var(--colorBgDark); }
        .button-toolbar > button > span + .button-title, .button-toolbar > button.button-textonly { padding-top: 2px }
    `;
        document.getElementsByTagName('head')[0].appendChild(style);
    };
    
    function statusDropdown() {
        if (!document.getElementById('statusDropdown')) {
            statusStyle();
        }
        const adr = document.querySelector('.UrlBar');
        const btn = document.createElement('div');
        btn.id = 'statusButton';
        btn.classList.add('button-toolbar');
        btn.setAttribute('title', 'Toggle status bar');
        btn.innerHTML = '<button id="statusToggle" tabindex="-1"><svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg"><path d="M15.486 18l.514-.469L11.026 13 16 8.469 15.486 8 10 13z"></path></button>';
        adr.insertBefore(btn, document.querySelector('.toolbar-extensions'));
        const cont = document.createElement('div');
        cont.id = 'statusContainer';
        cont.style.display = 'none';
        adr.appendChild(cont);
        document.getElementById('statusToggle').addEventListener('click', statusToggle);
    };
    
    var appendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function () {
        if (arguments[0].tagName === 'BUTTON') {
            setTimeout(function() {
                if (this.classList.contains('profile-popup')) {
                    const statusButton = document.getElementById('statusButton');
                    const adr = document.querySelector('.toolbar-addressbar')
                    if (statusButton) {
                        adr.insertBefore(this, statusButton);
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
