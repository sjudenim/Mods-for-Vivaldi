(function() {

    let checkExist = setInterval(function() {
        let adr = document.querySelector(".toolbar-addressbar.toolbar");
        if (adr != null) {
            let panel = document.getElementById('panels-container');
            let paneltog = document.querySelector(".paneltogglefooter");
            let panelsvg = document.querySelector(".paneltogglefooter svg");
            let panelpath = document.querySelector(".paneltogglefooter svg path");
            let paneltogbtn = "d: path('M5.29 16.5l11.438-.018c.152-.001.272-.113.272-.251L16.985 5.75c0-.139-.121-.251-.272-.25l-11.44.019c-.151 0-.273.113-.273.252l.015 10.479c.001.139.123.251.275.25zm7.884-10.495L16.439 6l.017 9.982-3.27.007-.012-9.984zm-7.63.014l7.083-.013.017 9.983L5.559 16l-.015-9.981z')";
            paneltog.classList.add('button-toolbar', 'paneltoggle');
            paneltog.classList.remove('button-toolbar-small');
            panelsvg.setAttributeNS(null, "viewBox", "0 0 22 22");
            adr.appendChild(paneltog);

            if (panel.classList.contains('switcher')) {
                panelpath.style = paneltogbtn;
            } else {
                panelpath.style = paneltogbtn;
            }

            paneltog.addEventListener('click', function() {
                if (panel.classList.contains('switcher')) {
                    panelpath.style = paneltogbtn;
                    paneltog.classList.add('active');

                } else {
                    panelpath.style = paneltogbtn;
                    paneltog.classList.remove('active');
                }
            });

            clearInterval(checkExist);
        }
    }, 100);

})();