/*
*  Vivaldi Addressfield Reload (updated for browser version 7.0)
*  Written by nomadic and sudenim
*  GNU General Public License v3.0
*
*  Moves the reload button to the end of the addressfield
*/

(function () {
    function moveReloadButton() {
      function style() {
        const style = document.createElement("style");
        style.innerHTML = `
        #reload { height: 20px; width: 20px; }
        #reload svg { flex: 0 0 22px !important; width: 22px !important; height: 22px !important; }
     `;
        document.getElementsByTagName("head")[0].appendChild(style);
      }
  
      function reload() {
        let urlField = document.querySelector(".UrlBar-AddressField");
  
        let reloadButton =
          document.querySelector('.button-toolbar[title="Reload (Ctrl+R)"]') ||
          document.querySelector('.button-toolbar[title="Stop"]');
        // noticed a difference in HTML structure between 2 installs, this fixes that
        if (!reloadButton) {
          reloadButton =
            document.querySelector('.button-toolbar > button[title="Reload (Ctrl+R)"]') ||
            document.querySelector('.button-toolbar > button[title="Stop"]');
          reloadButton = reloadButton.parentElement;
        }
  
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
    }, 600);
  })();
