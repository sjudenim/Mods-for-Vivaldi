function overlayToggle() {

    function icn() {
        if (cont.classList.contains('overlay') && exec === 0 || !cont.classList.contains('overlay') && exec === 1) {
            pathS.setAttribute('d', circE);
        }
        else {
            pathS.setAttribute('d', circD);
        }
        exec = 1;
    };

    function simulateClick() {
        const toggle = document.querySelector('.paneltogglefooter');
        var evt = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            altKey: true
        });
        icn();
        toggle.dispatchEvent(evt);
    };

    var exec = 0;
    const circE = 'M 13 13m -6, 0a 6,6 0 1,0 12,0a 6,6 0 1,0 -12,0 M 13 13m -4, 0a 4,4 0 1,0 8,0a 4,4 0 1,0 -8,0 M 13 13m -2, 0a 2,2 0 1,0 4,0a 2,2 0 1,0 -4,0';
    const circD = 'M 13 13m -5.5, 0a 5.5,5.5 0 1,0 11,0a 5.5,5.5 0 1,0 -11,0 M 13 13m -2, 0a 2,2 0 1,0 4,0a 2,2 0 1,0 -4,0';
    const cont = document.getElementById('panels-container');
    const switchS = document.getElementById('switch');
    var btnS = document.createElement('button');
    btnS.classList.add('preferences');
    btnS.id = 'overlayToggle';
    btnS.title = 'Toggle Overlay';
    btnS.setAttribute('tabindex', '-1');
    btnS.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd"></path></svg>';
    switchS.lastChild.style = 'margin-top: 0px';
    switchS.insertBefore(btnS,switchS.lastChild);
    const pathS = document.querySelector('#overlayToggle svg path');
    icn();
    document.getElementById('overlayToggle').addEventListener('click', simulateClick);
};

// Loop waiting for the browser to load the UI. You can call all functions from just one instance.

setTimeout(function wait() {
    const browser = document.getElementById('browser');
    if (browser) {
        overlayToggle();
    }
    else {
        setTimeout(wait, 300);
    }
}, 300);