/*
* Vivaldi Side Panel toggle
* Written by sjudenim
* GNU General Public License v3.0
* 
* Moves the side panel toggle from the status bar and postions it before the windows button group
* Replaces the icon and turns the panel overlay into a (large) drop down menu
*/

(function () {

    function panelToggleStyle() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
        .button-toolbar.panel-toggle { position: absolute; top: 0; right: 132px; width: 40px; transform: none !important; z-index: 88; }
        #main > div.toolbar.toolbar-addressbar.toolbar-mainbar.toolbar-large > div.button-toolbar.panel-toggle.paneltoggle > button:hover, #main > div.toolbar.toolbar-addressbar.toolbar-mainbar.toolbar-large > div.button-toolbar.panel-toggle.paneltoggle > button.active:hover { background-color: var(--colorAccentBgFadedMore) !important; fill: var(--colorAccentFg); }
        .button-toolbar.panel-toggle.active { background-color: var(--colorBgDark) !important; fill: var(--colorHighlightBg); opacity: 1 !important; }
        #panels-container.overlay .panel-group { backdrop-filter: blur(5px); }
    `;
        document.getElementsByTagName('head')[0].appendChild(style);
    };

    let checkExist = setInterval(function() {
        let addressBar = document.querySelector(".UrlBar");
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
