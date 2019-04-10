/*
 * Class Name Buttons
 * Written by Tam710562
 */

(function () {
  function getReactEventHandlersKey(element) {
    for (var key in element) {
      if (key.indexOf('__reactEventHandlers') > -1) {
        return key;
      }
    }
  }

  function classNameButtons(browser) {
    var reactEventHandlersKey = getReactEventHandlersKey(browser);
    if (reactEventHandlersKey) {
      document.querySelectorAll('.toolbar-droptarget').forEach((toolbar) => {
        var j = 0;
        var skipVersionInfo = false;
        var buttonToolbars = [].filter.call(toolbar.children, function(el) {
          return typeof el[reactEventHandlersKey] !== 'undefined';
        });
        if (toolbar[reactEventHandlersKey].children.length > buttonToolbars.length) {
          skipVersionInfo = true;
        }
        for (var i = 0; i < buttonToolbars.length; i++) {
          if(skipVersionInfo && toolbar[reactEventHandlersKey].children[i].props.name === 'VersionInfo') {
            j += 1;
          }
          var nameButton = toolbar[reactEventHandlersKey].children[j].props.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
          buttonToolbars[i].classList.add(nameButton);
          j++;
        }
      });
    }
    browser.dataset.classNameButtons = true
  }
  
  setTimeout(function wait() {
    var browser = document.getElementById('browser');
    if (browser) {
      classNameButtons(browser);
    } else {
      setTimeout(wait, 300);
    }
  }, 300);
})();
 9  
