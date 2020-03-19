(function() {
  // ============================================================================================================
  // Gives Zoom Interface in the Address Bar
  //    - written by nomadic and sjudenim
  // ============================================================================================================
function zoomControl() {
    // CONFIGURATION: ---------------------------------------------------------------
    //  - in Vivaldi's settings you can set the default page zoom, this
    //    will follow that if RESET_ZOOM_LEVEL is set to 100
    const RESET_ZOOM_LEVEL = 100; // 100 %  -> the zoom that hitting the reset button will default to
    const ZOOM_INCREMENT_AMOUNT = 10; // 10 %  -> the amount the zoom is either raised or lowered
    // MODES----------------
    // Mode 0: only clicking button opens and closes the panel
    // Mode 1: clicking the button opens the panel and the panel auto closes if not hovered over
    //    Option for mode 1:
    //        FADE_OUT_TIME  ->  the number of seconds the panel goes without hover before closing
    // Mode 2: just hovering over the button will open the panel and the panel auto closes if not hovered over
    //    Options for mode 2:
    //        FADE_OUT_TIME  ->  the number of seconds the panel goes without hover before closing
    //        IS_AUTO_OPENED_ON_ADDRESSBAR  ->  instead of only the button being hovered, the whole address bar is used
    const MODE = 1;
    // ---------------------
    // Option for modes 1 and 2:
    const FADE_OUT_TIME = 2; // 3 seconds  -> can be set to any positive half second increment (ex. 0, 0.5, 1, 1.5 ...)
    // Option for mode 2:
    const IS_AUTO_OPENED_ON_ADDRESSBAR = false;
    // ------------------------------------------------------------------------------

    // Creates the zoom button and panel initially, and then updates the icon depending on the zoom level
    function updateZoomIcon(zoomInfo) {
      let newZoom = zoomInfo.newZoomFactor;
      let zoomIconPath;

      // create the button if it isn't already there
      let alreadyExists = document.querySelector(".zoomIcon-c");
      if (!alreadyExists) {
        let zoomBtn = document.createElement("div");
        zoomBtn.setAttribute("class", "button-toolbar zoom-hover-target");
        zoomBtn.innerHTML = `
          <div class="zoom-parent">
            <div class="zoom-panel">
              <div class="page-zoom-controls-c">
                <div class="button-toolbar-c reset-zoom-c" title="Reset Zoom">
                  <button tabindex="-1" class="button-textonly-c" id="zoom-reset-c">
                    <span class="button-title">Reset</span>
                  </button>
                </div>
                <div class="button-toolbar-c" title="Zoom Out">
                  <button tabindex="-1" id="zoom-out-c">
                    <span>
                      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 8C4 8.55228 4.44772 9 5 9H11C11.5523 9 12 8.55228 12 8C12 7.44772 11.5523 7 11 7H5C4.44772 7 4 7.44772 4 8Z"></path>
                      </svg>
                    </span>
                  </button>
                </div>
                <span class="zoom-percent-c"></span>
                <div class="button-toolbar-c" title="Zoom In">
                  <button tabindex="-1" id="zoom-in-c">
                    <span>
                      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 7V5C7 4.44772 7.44772 4 8 4C8.55228 4 9 4.44772 9 5V7H11C11.5523 7 12 7.44772 12 8C12 8.55228 11.5523 9 11 9H9V11C9 11.5523 8.55228 12 8 12C7.44772 12 7 11.5523 7 11V9H5C4.44772 9 4 8.55228 4 8C4 7.44772 4.44772 7 5 7H7Z"></path>
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button tabindex="-1" title="Adjust Zoom" id="zoom-panel-btn">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewbox="0 0 16 16" class="zoomIcon-c">
              </svg>
            </span>
          </button>
        `;

        // inserts the button to the left of the bookmark icon
        let addressBar = document.querySelector(".addressfield > .toolbar");
        let bookmarkBtn = addressBar.querySelector(".create-bookmark");
        addressBar.insertBefore(zoomBtn, bookmarkBtn);

        // listener for the magnifying glass button to expand or collapse the control panel
        document
          .getElementById("zoom-panel-btn")
          .addEventListener("click", function() {
            let nav = document.getElementsByClassName("zoom-panel")[0];
            let elementToTheLeft =
              nav.parentElement.parentElement.previousElementSibling;
            elementToTheLeft.style.transition = "0.5s";
            navToggle(nav, elementToTheLeft);
          });

        // listener for the zoom in button in the zoom control panel
        document
          .getElementById("zoom-in-c")
          .addEventListener("click", incrementPercent);

        // listener for the zoom out button in the zoom control panel
        document
          .getElementById("zoom-out-c")
          .addEventListener("click", decrementPercent);

        // listener for the zoom reset button in the zoom control panel
        document
          .getElementById("zoom-reset-c")
          .addEventListener("click", resetZoom);

        // starts esentially a hover listener that modes 1 and 2 need
        if (MODE === 1 || MODE === 2) {
          zoomPanelHoverTracker();
        }
      }

      // set the icon based on the new zoom level
      if (newZoom < RESET_ZOOM_LEVEL / 100) {
        // zoomed out
        zoomIconPath = `
          <path d="M9.17 1.5c-2.94 0-5.33 2.39-5.33 5.33 0 1.287.458 2.47 1.22 3.393l-3.56 3.56.719.717 3.558-3.56a5.306 5.306 0 003.393 1.22 5.337 5.337 0 005.33-5.33A5.337 5.337 0 009.17 1.5zM6.355 6.186h5.579a.614.614 0 110 1.229H6.355a.615.615 0 110-1.23z" fill="var(--colorHighlightBg)"/>
        `;
      } else if (newZoom > RESET_ZOOM_LEVEL / 100) {
        // zoomed in
        zoomIconPath = `
          <path d="M9.17 1.5c-2.94 0-5.33 2.39-5.33 5.33 0 1.287.458 2.47 1.22 3.393l-3.56 3.56.719.717 3.558-3.56a5.306 5.306 0 003.393 1.22 5.337 5.337 0 005.33-5.33A5.337 5.337 0 009.17 1.5zm-.006 1.916c.341 0 .615.274.615.615v2.153h2.155a.614.614 0 110 1.23H9.78V9.61a.614.614 0 01-.615.616.614.614 0 01-.615-.616V7.414H6.355a.614.614 0 110-1.229h2.196V4.032c0-.34.272-.615.613-.615z" fill="var(--colorHighlightBg)"/>
        `;
      } else {
        // default zoom icon
        zoomIconPath = `
          <path d="M9.17 1.5a5.336 5.336 0 00-5.331 5.331c0 1.287.458 2.469 1.221 3.392l-3.56 3.56.718.717 3.56-3.561a5.305 5.305 0 003.392 1.222A5.337 5.337 0 0014.5 6.83 5.337 5.337 0 009.17 1.5zm0 9.646c-2.38 0-4.315-1.937-4.315-4.315S6.79 2.515 9.17 2.515c2.379 0 4.314 1.936 4.314 4.315s-1.935 4.316-4.314 4.316z"/>
        `;
      }

      // insert the new icon
      let zoomSVG = document.querySelector(".zoomIcon-c");
      zoomSVG.innerHTML = zoomIconPath;

      // make the percent in the controls match the current zoom level
      updatePercent(newZoom);
    }

    // Makes the zoom controls slide out
    function openNav(nav, elToLeft) {
      nav.classList.add("expanded-nav-c");
      elToLeft.classList.add("expanded-left-c");
    }

    // Hides the zoom controls
    function closeNav(nav, elToLeft) {
      nav.classList.remove("expanded-nav-c");
      elToLeft.classList.remove("expanded-left-c");
    }

    // Toggles the zoom controls open or closed depending on the current state
    function navToggle(nav, elToLeft) {
      if (nav.offsetWidth === 0) {
        return openNav(nav, elToLeft);
      } else {
        return closeNav(nav, elToLeft);
      }
    }

    // Puts the zoom level percentage in the zoom controls panel
    function updatePercent(zoomLevel) {
      let zoomPercent = Math.round(zoomLevel * 100);
      let percentageSpan = document.querySelector(".zoom-percent-c");
      percentageSpan.innerHTML = zoomPercent + " %";
    }

    // Zooms in the page by the specified increment
    function incrementPercent() {
      chrome.tabs.getZoom(function(zoomLevel) {
        let newZoomLevel = zoomLevel + ZOOM_INCREMENT_AMOUNT / 100;

        // Max zoom that Vivaldi allows is 500 %
        if (newZoomLevel <= 5) {
          chrome.tabs.setZoom(newZoomLevel, updatePercent(newZoomLevel));
        }
      });
    }

    // Zooms out the page by the specified increment
    function decrementPercent() {
      chrome.tabs.getZoom(function(zoomLevel) {
        let newZoomLevel = zoomLevel - ZOOM_INCREMENT_AMOUNT / 100;

        // Min zoom that Vivaldi allows is 20 %
        if (newZoomLevel >= 0.2) {
          chrome.tabs.setZoom(newZoomLevel, updatePercent(newZoomLevel));
        }
      });
    }

    // Sets the zoom back to the default zoom level
    //  - in Vivaldi's settings you can set the default page zoom, this
    //    will follow that if RESET_ZOOM_LEVEL is set to "100"
    function resetZoom() {
      let zoomLevel = RESET_ZOOM_LEVEL / 100;
      chrome.tabs.setZoom(zoomLevel, updatePercent(zoomLevel));
    }

    // For modes 1 and 2:
    // Tracks if you are hovering over the zoom controls
    function zoomPanelHoverTracker() {
      let zoomPanel = document.getElementsByClassName("zoom-panel")[0];
      let elementToTheLeft =
        zoomPanel.parentElement.parentElement.previousElementSibling;
      let isHovered = false;
      let intervalID = null;
      let count = 0;

      // selects which element must be hovered to trigger action
      let hoverElement;
      if (MODE === 2 && IS_AUTO_OPENED_ON_ADDRESSBAR) {
        let addressBar = document.querySelector(
          ".toolbar-addressbar.toolbar-mainbar"
        );
        hoverElement = addressBar;
      } else {
        let zoomBtnAndPanel = document.querySelector(".zoom-hover-target");
        hoverElement = zoomBtnAndPanel;
      }

      // when the element is hovered, reset the interval counter and opens the controls if needed
      hoverElement.onmouseover = function() {
        count = 0;
        isHovered = true;
        if (MODE !== 1) {
          openNav(zoomPanel, elementToTheLeft);
        }
      };

      // when the element loses hover, closes the controls if enough time has passed
      hoverElement.onmouseout = function() {
        // removes any previous counters (needed for if hover is lost and regained multiple times)
        if (intervalID) {
          clearInterval(intervalID);
        }
        isHovered = false;
        // start a counter to see how long it has been since the element was last hovered
        intervalID = setInterval(function() {
          // only increment the counter as long as hover isn't regained
          if (isHovered === false) {
            count++;
          }
          // once the correct amount of time has ellapsed, close the controls panel
          if (count >= FADE_OUT_TIME * 2) {
            closeNav(zoomPanel, elementToTheLeft);
            clearInterval(intervalID);
          }
        }, 500);
      };
    }

    // CHANGE: Added in Update #1
    // updates zoom percentage on tab change
    function tabChangeUpdateZoomWrapper() {
      chrome.tabs.getZoom(function(zoomLevel) {
        let zoomInfo = {
          newZoomFactor: zoomLevel
        };
        updateZoomIcon(zoomInfo);
      });
    }

    // zoom change listener
    chrome.tabs.onZoomChange.addListener(updateZoomIcon);

    // CHANGE: Added in Update #1
    // Listener for active tab change
    chrome.tabs.onActivated.addListener(tabChangeUpdateZoomWrapper);
  }

  // Loop waiting for the browser to load the UI
  setTimeout(function wait() {
    const browser = document.getElementById("browser");
    if (browser) {
      zoomControl();
    } else {
      setTimeout(wait, 300);
    }
  }, 300);
})();
