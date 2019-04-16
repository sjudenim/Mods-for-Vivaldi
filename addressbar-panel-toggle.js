(function() {

    function toggleStyle() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
        .panel-clickoutside-ignore.button-toolbar.panel-toggle {
            position: absolute;
            right: 132px;
            margin-top: 0;
            height: 34px !important;
            width: 36px !important;
        }
        .panel-clickoutside-ignore.button-toolbar.panel-toggle:hover,
        .panel-clickoutside-ignore.button-toolbar.panel-toggle.active:hover {
            background-color: var(--colorAccentBgFadedMore) !important;
            fill: var(--colorAccentFg);
            opacity: .8;
        }
        .panel-clickoutside-ignore.button-toolbar.panel-toggle.active {
            background-color: var(--colorBgIntense) !important;
            fill: var(--colorHighlightBg);
            opacity: 1;
        }
        .panel-clickoutside-ignore.button-toolbar.panel-toggle:hover svg path {d: path('M16.5 18.5v-9l-7 4.5z') !important}
        .panel-clickoutside-ignore.button-toolbar.panel-toggle.active:hover svg path {d: path('M9.5 9.5v9l7-4.5z') !important}
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
            let paneltogbtn = "d: path('M16.153 9.533l-6.538 4.219c-.154.097-.154.399 0 .498l6.538 4.219a.203.203 0 0 0 .232-.01.306.306 0 0 0 .114-.245v-8.43a.31.31 0 0 0-.114-.244.205.205 0 0 0-.232-.007zm-.123 8.215l-5.809-3.75 5.809-3.744v7.494z')";
            let paneltogbtnA = "d: path('M17.5 10.5h-9l4.5 7z')";
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
