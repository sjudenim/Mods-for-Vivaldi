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
        #browser.address-off #statusButton {
            display: none;
        }
        #statusToggle {
            position: absolute;
            right: calc(50vw + 22.5vw - 1px);
            margin-top: 17px;
            opacity: .9;
            z-index: 999
        }
        #statusToggle:hover {
            background-color: var(--colorAccentBgFadedMore);
            fill: var(--colorAccentFg);
        }
        #statusButton.active {
            fill: var(--colorHighlightBg);
            opacity: 1 !important;
        }
        #statusContainer {
            position: absolute;
            z-index: 1;
            right: calc(50vw + 22.5vw + 30px);
            top: 0;
        }
        .toolbar-statusbar .button-toolbar > button:hover, .toolbar-statusbar .button-toolbar > button.button-pressed {
            background-color: transparent !important;
            fill: var(--colorHighlightBg); 
        }
        .toolbar-statusbar {
            border: none;
            background-color: transparent !important;
            margin-top: 5px;
            padding: 0 4px;
        }
        .page-zoom-controls {
            margin-top: 1px;
        }
        .button-popup.button-popup-above:after {
            border-top-color: var(--colorBgDark);
        }
        .button-popup {
            bottom: unset;
            top: 32px;
            border-radius: 3px;
        }
        .toolbar-statusbar .button-popup:before {
            bottom: 0;
            transform: rotate(180deg)
        }
        .button-popup-arrow--light--above:after {
            border-top-color: var(--colorBgDark);
            border-top: 10px solid var(--colorBgDark);
        }
        .button-popup .button-popup-wrapper {
            height: fit-content;
        }
        .button-popup h2 {
            background-color: var(--colorBgDark);
            text-align: center
        }
        .button-popup-wrapper {
            background-color: var(--colorBgDark);
        }
        .StatusInfo-Content {
            display: none;
        }
    `;
        document.getElementsByTagName('head')[0].appendChild(style);
    };
    
    function statusDropdown() {
        if (!document.getElementById('statusDropdown')) {
            statusStyle();
        }
        const adr = document.querySelector('.toolbar-addressbar');
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
