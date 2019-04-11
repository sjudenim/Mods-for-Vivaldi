(function() {

    function toggleStyle() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
        .panel-clickoutside-ignore.button-toolbar.panel-toggle {
            position: absolute;
            right: 140px;
            margin-top: 0;
            height: 36px !important;
            width: 34px !important;
            opacity: .3;
        }
        .panel-clickoutside-ignore.button-toolbar.panel-toggle:hover, .panel-clickoutside-ignore.button-toolbar.panel-toggle svg:hover {
            background-color: var(--colorAccentBg) !important;
            opacity: .8;
        }
        .panel-clickoutside-ignore.button-toolbar.panel-toggle.active {
            background-color: var(--colorBgIntense) !important;
            fill: var(--colorHighlightBg);
            opacity: 1;
        }
    `;
        document.getElementsByTagName('head')[0].appendChild(style);
    };

    let checkExist = setInterval(function() {
        let adr = document.querySelector(".toolbar-addressbar.toolbar");
        if (adr != null) {
            let panel = document.getElementById('panels-container');
            let paneltog = document.querySelector(".panel-clickoutside-ignore.button-toolbar.panel-toggle");
            let panelsvg = document.querySelector(".panel-clickoutside-ignore.button-toolbar.panel-toggle svg");
            let panelpath = document.querySelector(".panel-clickoutside-ignore.button-toolbar.panel-toggle svg path");
            let paneltogbtn = "d: path('M6 15h2v-2H6v2zm6 0h2v-2h-2v2zm6 0h2v-2h-2v2z')";
            paneltog.classList.add('button-toolbar', 'paneltoggle');
            paneltog.classList.remove('button-toolbar-small');
            panelsvg.setAttributeNS(null, "viewBox", "0 0 26 26");
            adr.appendChild(paneltog);

            if (panel.classList.contains('switcher')) {
                panelpath.style = paneltogbtn;
                toggleStyle();
            }

            paneltog.addEventListener('click', function() {
                if (panel.classList.contains('switcher')) {
                    paneltog.classList.remove('active');

                } else {
                    paneltog.classList.add('active');
                }
            });

            clearInterval(checkExist);
        }
    }, 100);

})();