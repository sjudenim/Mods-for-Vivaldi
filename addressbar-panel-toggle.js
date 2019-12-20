(function () {

    function panelToggleStyle() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
        .button-toolbar.panel-toggle {
            position: absolute;
            top: 0;
            right: 132px;
            width: 44px;
            transform: none !important;
            z-index: 88;
        }
        #main > div.toolbar.toolbar-addressbar.toolbar-mainbar.toolbar-large > div.button-toolbar.panel-toggle.paneltoggle > button:hover,
        #main > div.toolbar.toolbar-addressbar.toolbar-mainbar.toolbar-large > div.button-toolbar.panel-toggle.paneltoggle > button.active:hover {
            background-color: var(--colorAccentBgFadedMore) !important;
            fill: var(--colorAccentFg);
        }
        .button-toolbar.panel-toggle.active {
            fill: var(--colorHighlightBg);
            opacity: 1 !important;
        }
        /* Turns the overlay into a dropdown menu */
        .button-toolbar.panel-toggle.active:before {
            content: '';
            border-color: hsla(0, 0%, 0%, 0) hsla(0, 0%, 0%, 0) var(--colorBgDark) hsla(0, 0%, 0%, 0);
            border-style: solid;
            border-width: 8px;
            bottom: -4px;
            height: 0;
            right: 14px;
            position: absolute;
            width: 0;
            z-index: 2;
            opacity: .98;
        }
        div#main.right #panels-container.overlay {
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25) !important;
            height: 80vh;
            top: 4px;
            right: 4px !important;
        }
        #switch {
            border-radius: 0 3px 3px 0;
        }
        .right#panels-container.overlay .panel-group {
            border-radius: 3px 0 0 3px;
            backdrop-filter: blur(5px);
        }
    `;
        document.getElementsByTagName('head')[0].appendChild(style);
    };

    let checkExist = setInterval(function() {
        let addressBar = document.querySelector(".toolbar-addressbar.toolbar");
        if (addressBar) {
            let panel = document.getElementById('panels-container');
            let paneltog = document.querySelector(".button-toolbar.panel-toggle");
            let panelsvg = document.querySelector(".button-toolbar.panel-toggle svg");
            let panelpath = document.querySelector(".button-toolbar.panel-toggle svg path");
            let paneltogbtn = "d: path('M19 10.513L18.438 10 13 14.973 7.563 10 7 10.513 13 16z')";
            let paneltogbtnA = "d: path('M19 10.513L18.438 10 13 14.973 7.563 10 7 10.513 13 16z')";
            paneltog.classList.add('button-toolbar', 'paneltoggle');
            paneltog.classList.remove('button-toolbar-small');
            panelsvg.setAttributeNS(null, "viewBox", "0 0 26 26");
            addressBar.appendChild(paneltog);

            if (panel.classList.contains('switcher')) {
                panelpath.style = paneltogbtn;
                panelToggleStyle();
            }

            paneltog.addEventListener('click', function() {
                if (panel.classList.contains('switcher')) {
                    paneltog.classList.remove('active');
                    panelpath.style = paneltogbtn;
                } else {
                    paneltog.classList.add('active');
                    panelpath.style = paneltogbtnA;
                }
            });

            clearInterval(checkExist);
        }
    }, 300);

})();
