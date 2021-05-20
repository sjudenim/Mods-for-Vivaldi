//
//  Vivaldi Addressbar Rearranging (updated for browser version 3.6)
//  Written by nomadic and sjudenim
//  GNU General Public License v3.0
//
//
(function () {
  function rearrangingAddressbar() {
    const ALL_CHANGES = {
      ExtensionsBar: {
        id: "ExtensionsBar",
        isAddressBarOnly: true,
        isAffectedByFullscreen: true,
        moveAction() {
          let extensionsContainer = document.querySelector(".toolbar-extensions");
          let toolBar = document.querySelector(".toolbar-mainbar.UrlBar");
          let urlBar = document.getElementsByClassName("UrlBar-AddressField")[0];

          // make sure everything is defined
          if (!(extensionsContainer && toolBar && urlBar)) return false;

          extensionsContainer.id = "moved-extensions";

          toolBar.insertBefore(extensionsContainer, urlBar);

          // generate extension button css so they don't push the toggle
          chrome.management.getAll((allExtensions) => {
            let extensionCount = 0;
            allExtensions.forEach((extension) => {
              if (extension.enabled) {
                extensionCount++;
              }
            });
            let style = document.getElementById("extensionBtnPositioning");
            style.innerHTML = "";
            for (let i = extensionCount; i > 0; --i) {
              style.innerHTML += `
              .ExtensionIcon--Hidden:nth-of-type(${i}) {
                position: absolute;
                right: ${(extensionCount - i) * 30 + 34}px;
              }
            `;
            }
          });
          return true;
        },
        onStartUp() {
          const style = document.createElement("style");
          style.innerHTML = "";
          style.id = "extensionBtnPositioning";
          document.getElementsByTagName("head")[0].appendChild(style);
        },
      },
      // ============================================================================================================================================
      MenuButton: {
        id: "MenuButton",
        isAddressBarOnly: false,
        isAffectedByFullscreen: false,
        saved() {
          return document.querySelector(".vivaldi");
        },
        moveAction(saved) {
          let menuButton = document.querySelector(".vivaldi") || saved;
          let toolBar = document.querySelector(".toolbar-mainbar.UrlBar") || document.querySelector(".toolbar-mainbar.toolbar-mailbar");

          // make sure everything is defined
          if (!(menuButton && toolBar)) return false;

          toolBar.insertBefore(menuButton, toolBar.firstChild);
          return true;
        },
      },
      // ============================================================================================================================================
      ReloadButton: {
        id: "ReloadButton",
        isAddressBarOnly: true,
        isAffectedByFullscreen: false,
        moveAction() {
          let urlField = document.querySelector(".toolbar-small.toolbar-insideinput");
          let reloadButton = document.querySelector('.button-toolbar[title="Reload current page"]') || document.querySelector('.button-toolbar[title="Stop"]');
          // noticed a difference in HTML structure between 2 installs, this fixes that
          if (!reloadButton) {
            reloadButton = document.querySelector('.button-toolbar > button[title="Reload current page"]') || document.querySelector('.button-toolbar > button[title="Stop"]');
            if (!reloadButton) return false;
            reloadButton = reloadButton.parentElement;
          }

          // make sure everything is defined
          if (!(reloadButton && urlField)) return false;

          reloadButton.id = "moved-reload";

          urlField.appendChild(reloadButton);
          return true;
        },
      },
      // ============================================================================================================================================
      StatusBar: {
        id: "StatusBar",
        isAddressBarOnly: false,
        isAffectedByFullscreen: true,
        moveAction(saved, isMailBar) {
          function moveStatusBar(isMailBar) {
            if (isMailBar) {
              // tell vivaldi to turn the status bar off
              vivaldi.prefs.set({ path: "vivaldi.status_bar.display", value: "off" });
              // console.log("turned off");
              return true;
            } else {
              vivaldi.prefs.get("vivaldi.status_bar.display", (statusBarState) => {
                if (statusBarState === "off") {
                  // tell vivaldi to turn the status bar on
                  vivaldi.prefs.set({ path: "vivaldi.status_bar.display", value: "on" });
                  // console.log("back on");
                  return false;
                }
                let toolBar = document.querySelector(".UrlBar");
                let urlField = document.querySelector(".UrlBar-AddressField");
                let statusBar = document.querySelector(".toolbar-statusbar");
                let statusToggle = document.getElementById("statusButton");
                let statusContainer = document.getElementById("statusContainer");

                // make sure everything is defined
                if (!statusBar) return false;

                if (!statusToggle) {
                  statusToggle = document.createElement("div");
                  statusToggle.id = "statusButton";
                  statusToggle.classList.add("button-toolbar");
                  statusToggle.setAttribute("title", "Toggle status bar");
                  statusToggle.innerHTML = `
              <button id="statusToggle" tabindex="-1">
                <svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.513 8L10 8.469 14.973 13 10 17.531l.513.469L16 13z"></path>
                </svg>
              </button>
            `;

                  // make sure everything is defined
                  if (!(statusToggle && toolBar)) return false;

                  toolBar.insertBefore(statusToggle, urlField.nextSibling);
                }

                if (!statusContainer) {
                  statusContainer = document.createElement("div");
                  statusContainer.id = "statusContainer";
                  statusContainer.style.display = "none";

                  // make sure everything is defined
                  if (!statusContainer) return false;

                  toolBar.insertBefore(statusContainer, statusToggle.nextSibling);

                  statusContainer.appendChild(statusBar);

                  statusToggle.addEventListener("click", () => {
                    if (statusContainer.style.display === "block") {
                      statusContainer.style.display = "none";
                      statusButton.classList.remove("active");
                    } else {
                      statusButton.classList.add("active");
                      statusContainer.style.display = "block";
                    }
                  });
                }

                return true;
              });
            }
          }

          return moveStatusBar(isMailBar);
        },
        onStartUp() {
          let browser = document.getElementById("browser");
          let browserObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
              if (Array.from(mutation.addedNodes).find((element) => element.classList.contains("toolbar-statusbar"))) {
                ALL_CHANGES["StatusBar"].moveAction(null, false);
              }
            });
          });
          browserObserver.observe(browser, { childList: true });

          let removeChild = Element.prototype.removeChild;
          Element.prototype.removeChild = function () {
            if (arguments[0].tagName === "DIV" && arguments[0].classList.contains("toolbar-statusbar")) {
              const statusButton = document.getElementById("statusButton");
              const statusContainer = document.getElementById("statusContainer");

              if (!(statusButton && statusContainer)) return;

              statusButton.remove();
              statusContainer.remove();
            } else {
              return removeChild.apply(this, arguments);
            }
          };
        },
      },
      // ============================================================================================================================================
      WindowButtons: {
        id: "WindowButtons",
        isAddressBarOnly: false,
        isAffectedByFullscreen: false,
        saved() {
          return document.querySelector(".window-buttongroup");
        },
        moveAction(saved) {
          let windowButtons = document.querySelector(".window-buttongroup") || saved;
          let toolBar = document.querySelector(".toolbar-mainbar.UrlBar") || document.querySelector(".toolbar-mainbar.toolbar-mailbar");

          // make sure everything is defined
          if (!(windowButtons && toolBar)) return false;

          toolBar.appendChild(windowButtons);
          return true;
        },
      },
    };

    // Handles the repetitive background aspect of each change
    // Calls the necessary action for each change and calls the callback after
    function executeMoveAction(change) {
      let isMailBar = document.querySelector(".toolbar-mainbar.toolbar-mailbar");
      isMailBar = isMailBar ? true : false;

      // keep track of how many times the change is attempted
      let tries = 0;
      let maxLimit = 3;

      // attempt the change until it is successful or the retry limit is reached
      let intervalID = setInterval(function () {
        if (change.moveAction(savedElements[change.id], isMailBar)) {
          clearInterval(intervalID);
          // call another function afterwards if specified
          if (change.hasOwnProperty("callBack")) change.callBack();
        }
        tries++;
        if (tries >= maxLimit) clearInterval(intervalID);
      }, 100);
    }

    // ==============================================================================
    // Mutation Observer for Address Bar Changes
    // ==============================================================================

    let main = document.getElementById("main");
    // get the initial state of the addressbar as either urlbar or mailbar
    let oldIsMailBarActive = main.firstChild.classList.contains("toolbar-mailbar");
    let addressBarObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        // only re-add on new nodes added. The list addedNodes will only have a length attribute when it contains added nodes
        if (mutation.addedNodes.length) {
          // get the new state of the addressbar
          let isMailBarActive = mutation.addedNodes[0].classList.contains("toolbar-mailbar");

          // Run all changes that are in both the url bar and the mail bar
          for (const change in ALL_CHANGES) {
            if (ALL_CHANGES[change].isAddressBarOnly) continue;
            executeMoveAction(ALL_CHANGES[change]);
          }

          // if it is different from the previous state, we need to act on it
          if (oldIsMailBarActive !== isMailBarActive) {
            // update the old value for comparisons on future mutations
            oldIsMailBarActive = isMailBarActive;
            // if the addressbar isn't the mailbar, we can re-add the button
            if (!isMailBarActive) {
              // Run all changes that are only in the url bar and not the mail bar
              for (const change in ALL_CHANGES) {
                if (!ALL_CHANGES[change].isAddressBarOnly) continue;
                executeMoveAction(ALL_CHANGES[change]);
              }
            }
          }
        }
      });
    });
    // only need to check childList for added nodes
    addressBarObserver.observe(main, { childList: true });

    // ==============================================================================
    // Mutation Observer for Fullscreen Changes
    // ==============================================================================

    let browser = document.getElementById("browser");
    let oldState = browser.classList.contains("fullscreen") || browser.classList.contains("minimal-ui");
    let fullscreenObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName == "class") {
          let isFullscreen = mutation.target.classList.contains("fullscreen") || mutation.target.classList.contains("minimal-ui");
          if (oldState !== isFullscreen) {
            oldState = isFullscreen;
            if (!isFullscreen) {
              // Run all changes that that are affected by fullscreen changes
              for (const change in ALL_CHANGES) {
                if (!ALL_CHANGES[change].isAffectedByFullscreen) continue;
                executeMoveAction(ALL_CHANGES[change]);
              }
            }
          }
        }
      });
    });

    fullscreenObserver.observe(browser, { attributes: true });

    // Initial set up
    var savedElements = {};
    for (const c in ALL_CHANGES) {
      let change = ALL_CHANGES[c];
      // call the functions to make the initial change
      if (change.hasOwnProperty("onStartUp")) change.onStartUp();
      executeMoveAction(change);

      // collect saved elements
      if (change.hasOwnProperty("saved")) {
        savedElements[change.id] = change.saved();
      } else {
        savedElements[change.id] = null;
      }
    }
  }

  // wait for the browser to load before starting mod
  let intervalID = setInterval(function () {
    const browser = document.getElementById("browser");
    if (browser) {
      clearInterval(intervalID);
      rearrangingAddressbar();
    }
  }, 300);
})();
