//
//  Vivaldi Menu button (updated for browser version 3.6)
//  Written by nomadic and sjudenim
//  GNU General Public License v3.0
//
//  Moves the menu button to the beginning of the address/mail toolbar 
//
(function () {
  
    function moveMenuButton() {

      function style() {
        const style = document.createElement('style');
        style.innerHTML = `
        .vivaldi svg { flex: 0 0 26px; height: 26px; }
        /* If using tabs on top, this will remove the space vacated by the menu button */
        #tabs-container.top { margin-top: -4px !important; padding-left: 0 !important; margin-right: -95px !important }
     `;
        document.getElementsByTagName('head')[0].appendChild(style);
      };

      function menu(menuButton) {
        let toolBar =
          document.querySelector(".toolbar-mainbar.UrlBar") || document.querySelector(".toolbar-mainbar.toolbar-mailbar");
  
        // make sure the buttons are not already added
        if (toolBar.querySelector(".vivaldi")) return;
  
        toolBar.insertBefore(menuButton, toolBar.firstChild);
      }
  
      // save the window button group for later usage.
      const menuButton = document.querySelector(".vivaldi");
  
      let main = document.getElementById("main");
      let observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          // only re-add on new nodes added. The list addedNodes will only have a length attribute when it contains added nodes
          if (mutation.addedNodes.length) {
            menu(menuButton);
            style();
          }
        });
      });
      // only need to check childList for added nodes
      observer.observe(main, {
        childList: true
      });
  
      menu(menuButton);
    }
  
    let intervalID = setInterval(() => {
      const browser = document.getElementById("browser");
      if (browser) {
        clearInterval(intervalID);
        moveMenuButton();
      }
    }, 300);
})();
