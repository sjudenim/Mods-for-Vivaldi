//
//  Vivaldi Window Buttons (updated for browser version 3.6)
//  Written by nomadic and sjudenim
//  GNU General Public License v3.0
//
//  Moves the window button group (minimize, restore, close) to the end of address/mail toolbar
//
(function () {

  function moveButtonsGroup() {

    function style() {
      const style = document.createElement('style');
      style.innerHTML = `
      .toolbar-mainbar.toolbar-mailbar { padding-right: 132px; }
   `;
      document.getElementsByTagName('head')[0].appendChild(style);
    };

    function buttonsGroup(windowButtons) {
      let toolBar =
        document.querySelector(".toolbar-mainbar.UrlBar") || document.querySelector(".toolbar-mainbar.toolbar-mailbar");

      // make sure the buttons are not already added
      if (toolBar.querySelector(".window-buttongroup")) return;

      toolBar.appendChild(windowButtons);
    }

    // save the window button group for later usage.
    const windowButtons = document.querySelector(".window-buttongroup");

    let main = document.getElementById("main");
    let observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        // only re-add on new nodes added. The list addedNodes will only have a length attribute when it contains added nodes
        if (mutation.addedNodes.length) {
          buttonsGroup(windowButtons);
          style();
        }
      });
    });
    // only need to check childList for added nodes
    observer.observe(main, {
      childList: true
    });

    buttonsGroup(windowButtons);
  }

  let intervalID = setInterval(() => {
    const browser = document.getElementById("browser");
    if (browser) {
      clearInterval(intervalID);
      moveButtonsGroup();
    }
  }, 300);
})();
