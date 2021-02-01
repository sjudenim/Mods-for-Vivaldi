//
//  Vivaldi Addressfield Reload (updated for browser version 3.6)
//  Written by nomadic and sjudenim
//  GNU General Public License v3.0
//
//  Moves the reload button to the end of the addressfield and replaces the icon
//
(function () {
    function moveReloadButton() {
      function style() {
        const style = document.createElement("style");
        style.innerHTML = `
        #reload { order: 1 }
        #reload svg { flex: 0 0 22px !important; width: 22px !important; height: 22px !important; margin-left: 4px; margin-top: 8px; }
        .button-toolbar > button[title="Reload current page"] svg path, .button-toolbar[title="Reload current page"] svg path { d: path('M14.997 6.063L15 1.409l-1.854 1.852-.203-.211A6.953 6.953 0 007.997 1C4.142 1 1 4.143 1 8c0 3.859 3.142 7 6.997 7 3.858 0 6.997-3.141 6.997-7h-1.355a5.647 5.647 0 01-5.642 5.645A5.648 5.648 0 012.355 8a5.647 5.647 0 015.642-5.641 5.6 5.6 0 013.989 1.65l.203.208-1.844 1.847 4.652-.001z') }
        .button-toolbar > button[title="Stop"] svg path, .button-toolbar[title="Stop"] svg path { d: path('M14 2.929L13.07 2 8 7.071 2.929 2 2 2.929 7.071 8 2 13.07l.929.93L8 8.93 13.07 14l.93-.932L8.932 8z') }
     `;
        document.getElementsByTagName("head")[0].appendChild(style);
      }
  
      function reload() {
        let urlField = document.querySelector(".toolbar-small.toolbar-insideinput");
  
        let reloadButton =
          document.querySelector('.button-toolbar[title="Reload current page"]') ||
          document.querySelector('.button-toolbar[title="Stop"]');
        // noticed a difference in HTML structure between 2 installs, this fixes that
        if (!reloadButton) {
          reloadButton =
            document.querySelector('.button-toolbar > button[title="Reload current page"]') ||
            document.querySelector('.button-toolbar > button[title="Stop"]');
          reloadButton = reloadButton.parentElement;
        }
  
        // Add an ID `#reload` so Tam's mod isn't necessary.
        // Chose ID over Class, use the commented out line if you want to use Class instead
        // reloadButton.classList.add("reload");
        reloadButton.id = "reload";
  
        // make sure the buttons are not already added
        if (urlField.querySelector("#reload")) return;
  
        urlField.appendChild(reloadButton);
      }
  
      let main = document.getElementById("main");
      // get the initial state of the addressbar as either urlbar or mailbar
      let oldIsMailBarActive = main.firstChild.classList.contains("toolbar-mailbar");
      let observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          // only re-add on new nodes added. The list addedNodes will only have a length attribute when it contains added nodes
          if (mutation.addedNodes.length) {
            // get the new state of the addressbar
            let isMailBarActive = mutation.addedNodes[0].classList.contains("toolbar-mailbar");
            // if it is different from the previous state, we need to act on it
            if (oldIsMailBarActive !== isMailBarActive) {
              // update the old value for comparisons on future mutations
              oldIsMailBarActive = isMailBarActive;
              // if the addressbar isn't the mailbar, we can re-add the button
              if (!isMailBarActive) {
                reload();
              }
            }
          }
        });
      });
      // only need to check childList for added nodes
      observer.observe(main, { childList: true });
  
      reload();
  
      // Only need to call style once
      style();
    }
  
    let intervalID = setInterval(() => {
      const browser = document.getElementById("browser");
      if (browser) {
        clearInterval(intervalID);
        moveReloadButton();
      }
    }, 300);
  })();
