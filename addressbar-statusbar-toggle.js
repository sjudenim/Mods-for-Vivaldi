(function () {

    function statusToggle() {
        const statusContainer = document.getElementById('statusContainer');
        const statusBar = document.querySelector('.toolbar-statusbar');
        if (statusContainer.style.display === 'block') {
            statusContainer.style.display = 'none';
            statusBar.classList.remove('zeig');
        }
        else {
            statusBar.classList.add('zeig');
            statusContainer.style.display = 'block';
        }
    };
    
    function statusInfoLogic() {
        const statusInfoToggle = document.getElementById('statusInfoToggle');
        const statusInfo = document.querySelector('.status-info');
        if (statusInfoToggle.classList.contains('zeig')) {
            statusInfoToggle.classList.remove('zeig');
            statusInfo.removeAttribute('id');
        }
        else {
            statusInfoToggle.classList.add('zeig');
            statusInfo.id = 'zeig';
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
            right: calc(50vw - 22.5vw - 34px);
            margin-top: -17px;
            opacity: .4;
        }
        #statusToggle:hover,
        #statusToggle.active:hover {
            background-color: var(--colorAccentBgFadedMore);
            fill: var(--colorAccentFg);
            opacity: .8;
        }
        #statusToggle.active {
            background-color: var(--colorBgDark) !important;
            fill: var(--colorHighlightBg);
            opacity: 1;
        }
        #statusContainer {
            position: absolute;
            z-index: 1;
            max-width: 100vw;
            right: calc(50vw - 22.5vw - 34px);
            top: calc(var(--toolbarHeight) + 4px);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        }
        .toolbar-statusbar {
            background-color: var(--colorBgDark) !important;
            padding: 0 4px;
            height: 34px !important;
            border-radius: 3px;
            border: none;
        }
        .toolbar-statusbar .button-popup.button-popup-above {
            bottom: unset;
            top: calc(var(--toolbarHeight) + 5px) !important;
            border-radius: 3px;
        }
        .toolbar-statusbar .button-popup.button-popup-above:before, .toolbar-statusbar .button-popup.button-popup-above:after {
            top: -20px;
            bottom: unset;
            transform: rotate(180deg)
        }
        #statusInfoToggle.zeig button svg {
            fill: var(--colorHighlightBg);
        }
        .status-info {
            display: none;
        }
        #zeig.status-info.visible {
            display: inline-block;
            order: -1
        }
        #statusContainer > div > div.toolbar.toolbar-mainbar.toolbar-extensions.toolbar-large > div.button-narrow.button-toolbar svg path {d: path('M12 6v2h2V6zm0 6v2h2v-2zm0 6v2h2v-2z')}
    `;
        document.getElementsByTagName('head')[0].appendChild(style);
    };
    
    function statusMod() {
        const statusBar = document.querySelector('.toolbar-statusbar');
        const statusInfo = document.querySelector('.status-info');
        const divL = document.createElement('divL');
        divL.classList.add('button-toolbar');
        divL.id = 'statusInfoToggle';
        divL.setAttribute('title', 'Toggle status info');
        divL.innerHTML = '<button draggable="false" tabindex="-1"><svg width="16" height="16" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg"><path d="M4.53 13.649a5.388 5.388 0 0 0-1.526 3.958 5.417 5.417 0 0 0 1.808 3.847l.066.06a5.746 5.746 0 0 0 4.082 1.482 5.721 5.721 0 0 0 3.962-1.752l3.229-3.361a.499.499 0 0 0-.027-.722l-2.164-1.958-1.781 1.854.602.545-1.806 1.88c-1.141 1.188-3.057 1.251-4.281.145l-.065-.06a2.878 2.878 0 0 1-.15-4.154l1.807-1.879.602.546 1.782-1.855-2.166-1.961a.539.539 0 0 0-.745.025l-3.229 3.36zm5.249-5.46a.498.498 0 0 0 .027.721l2.166 1.959 1.85-1.925-.603-.545 1.805-1.878c1.142-1.188 3.06-1.251 4.282-.145l.066.06a2.876 2.876 0 0 1 .146 4.154l-1.804 1.878-.604-.545-1.85 1.926 2.167 1.96a.536.536 0 0 0 .743-.023l3.297-3.432a5.398 5.398 0 0 0-.283-7.807l-.066-.06a5.753 5.753 0 0 0-4.078-1.483 5.73 5.73 0 0 0-3.966 1.754L9.779 8.189zm-.704 7.105a1.196 1.196 0 0 0 .062 1.726c.509.46 1.305.434 1.779-.06l.538-.56 1.781-1.854 1.303-1.357 1.85-1.925.538-.559a1.196 1.196 0 0 0-.063-1.727 1.286 1.286 0 0 0-1.779.061l-.537.559-1.851 1.927-1.303 1.356-1.78 1.853-.538.56z"/></svg></button>';
        statusBar.insertBefore(divL, statusInfo);
        document.getElementById('statusInfoToggle').addEventListener('click', statusInfoLogic);
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
        btn.innerHTML = '<button id="statusToggle" tabindex="-1"><svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg"><path d="M19 11.512L18.438 11 13 15.971 7.563 11 7 11.512 13 17z"></path></button>';
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