/*
* Vivaldi Menu button
* Written by sjudenim
* GNU General Public License v3.0
* 
*  Moves the menu button to the beginning of the addressbar
*/

(function () {

    function style() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.id = 'menuBtn';
        style.innerHTML = `
        .vivaldi, #browser .vivaldi span.burger-icon { position: relative; height: 34px !important; width: 40px; }
        #browser .vivaldi span.burger-icon svg path { d: path('M5 7.5v.846h16V7.5H5zm0 5.077v.846h16v-.846H5zm0 5.077v.846h16v-.846H5z'); }
        #browser .vivaldi span.burger-icon svg { margin-left: -5px; margin-top: -5px; }
        #browser .vivaldi:hover, #browser .vivaldi:active { background-color: var(--colorHighlightBg) !important; fill: white !important; }
        #browser .vivaldi:hover span svg { transform: scale(1) !important }
        .color-behind-tabs-on .vivaldi span.vivaldi-v, .color-behind-tabs-on .vivaldi span.burger-icon { opacity: initial !important; }
     `;
        document.getElementsByTagName('head')[0].appendChild(style);
    };
    
    function menuBtn() {
        style();
        var btn = document.querySelector(".vivaldi");
        btn.setAttribute('tabindex', '-1');
        var bar = document.querySelector(".UrlBar");
        var div = document.createElement('div');
        div.classList.add('button-toolbar');
        bar.insertBefore(div, bar.firstChild);
        div.appendChild(btn);
    }
    
    setTimeout(function wait() {
        const browser = document.getElementById('browser');
        if (browser) {
              menuBtn();
        }
        else {
             setTimeout(wait, 300);
        }
    });
    
    })();
