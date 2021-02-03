//
//  Vivaldi Panel Toggle for the Addressbar (updated for browser version 3.6)
//  Written by nomadic and sjudenim
//  GNU General Public License v3.0
//
//  Moves the panel toggle button to the end of the addressbar and replaces the icon (positioned to sit in front of the window button group)
//
(function () {

    function movePanelButton() {
  
      function style() {
        const style = document.createElement('style');
        style.innerHTML = `
        .button-toolbar.panel-clickoutside-ignore { position: absolute; right: 132px; }
        .toolbar-mainbar.toolbar-mailbar { padding-right: 166px; }
        
        `;
        document.getElementsByTagName('head')[0].appendChild(style);
      };
  
      function panel() {
        let toolBar = document.querySelector(".toolbar-mainbar.UrlBar") || document.querySelector(".toolbar-mainbar.toolbar-mailbar");
        let panelToggle = document.querySelector(".button-toolbar.panel-clickoutside-ignore");
        toolBar.appendChild(panelToggle);
        style();
      }
  
      // save the button later usage.
      const panelToggle = document.querySelector(".button-toolbar.panel-clickoutside-ignore");
  
      let main = document.getElementById("main");
      let observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          // only re-add on new nodes added. The list addedNodes will only have a length attribute when it contains added nodes
          if (mutation.addedNodes.length) {
            panel(panelToggle);
          }
        });
      });
      // only need to check childList for added nodes
      observer.observe(main, {
        childList: true
      });
  
      panel(panelToggle);
    }
  
    let intervalID = setInterval(() => {
      const browser = document.getElementById("browser");
      if (browser) {
        clearInterval(intervalID);
        movePanelButton();
      }
    }, 300);
  })();