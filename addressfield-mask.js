/*
 * Mask for the address bar
 * Written by Tam710562
 * Thanks to sjudenim and LonM for bug fixes and new ideas 
 */

window.gnoh = Object.assign(window.gnoh || {}, {
  encode: {
    html: function (rawStr) {
      return !rawStr ? rawStr : rawStr.replace(/[\u00A0-\u9999<>\&"'%]/gi, function (i) {
        return '&#' + i.charCodeAt(0) + ';';
      });
    }
  },
  createElement: function (element, attribute, parent, inner) {
    if (typeof element === 'undefined') {
      return false;
    }
    var el = document.createElement(element);
    if (!!attribute && typeof attribute === 'object') {
      Object.assign(el, attribute);
      if (typeof attribute.text !== 'undefined') {
        el.textContent = attribute.text;
      }
      if (typeof attribute.html !== 'undefined') {
        el.innerHTML = attribute.html;
      }
      if (typeof attribute.style === 'object') {
        for (var css in attribute.style) {
          el.style[css] = attribute.style[css];
        }
      }
      if (typeof attribute.events === 'object') {
        for (let key in attribute.events) {
          if (typeof attribute.events[key] === 'function') {
            el.addEventListener(key, attribute.events[key]);
          }
        }
      }
      for (var key in attribute) {
        if (key !== 'style' && key !== 'events' && key !== 'text' && key !== 'html') {
          if (typeof attribute[key] === 'object') {
            attribute[key] = JSON.stringify(attribute[key]);
          }
          el.setAttribute(key, attribute[key]);
        }
      }
    }
    if (!!inner) {
      if (!Array.isArray(inner)) {
        inner = [inner];
      }
      for (var k = 0; k < inner.length; k++) {
        if (inner[k].nodeName) {
          el.append(inner[k]);
        } else {
          el.append(this.createElementFromHTML(inner[k]));
        }
      }
    }
    if (typeof parent === 'string') {
      parent = document.querySelector(parent);
    }
    if (!!parent) {
      parent.append(el);
    }
    return el;
  },
  observeDOM: function (obj, callback, config) {
    const obs = new MutationObserver(function (mutations, observer) {
      if (config) {
        callback(mutations, observer);
      } else {
        if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
          callback(mutations, observer);
        }
      }
    });
    obs.observe(obj, config || {
      childList: true,
      subtree: true
    });
  },
  timeOut: function (callback, conditon, timeout) {
    setTimeout(function wait() {
      var result;
      if (!conditon) {
        result = document.getElementById('browser');
      } else if (typeof conditon === 'string') {
        result = document.querySelector(conditon);
      } else if (typeof conditon === 'function') {
        result = conditon();
      } else {
        return;
      }
      if (result) {
        callback(result);
      } else {
        setTimeout(wait, timeout || 300);
      }
    }, timeout || 300);
  },
  override: function (obj, functionName, callback, conditon) {
    obj[functionName] = (function (_super) {
      return function () {
        var result;
        if (typeof conditon === 'function' && conditon.apply(this, arguments) || conditon === undefined || conditon === true) {
          result = _super.apply(this, arguments);
        }
        callback.apply(this, arguments);
        return result;
      };
    })(obj[functionName]);
  },
  getReactEventHandlersKey: function (element) {
    if (!this.reactEventHandlersKey) {
      if (!element) {
        element = document.getElementById('browser');
      } else if (typeof element === 'string') {
        element = document.querySelector(element);
      }
      if (!element) {
        return;
      }
      this.reactEventHandlersKey = Object.keys(element).find(function (key) {
        return key.startsWith('__reactEventHandlers');
      });
    }
    return this.reactEventHandlersKey;
  }
});

(function () {
  const theme = 'theme-3';
  let enableDecodeURL = false;
  let isPrivate = false;
  let searchEngines = {
    default: undefined,
    defaultPrivate: undefined,
    engines: {}
  };
  let extensions = {};
  const themeSettings = {
    'theme-1': {
      decodeURL: false
    },
    'theme-2': {
      decodeURL: true
    },
    'theme-3': {
      decodeURL: false
    },
  };
  const pattern = {
    url: {
      full: /(([a-z-]+):(?!\/\/))?(([^\/]+):\/\/)?(([^\/?#:]+)(:([^\/?#]*))?)?(\/[^?#]*)?(\?[^#]*)?(#(.*))?/i,
      path: /\/([^/]*)/gi,
      search: /[?&]([^=&]+)?(=([^&]*))?/gi,
      host: {
        hostSub: {
          topLevel1: /((.*)\.)?([^.]+\.[a-z]{2,4})$/i,
          topLevel2: /((.*)\.)?([^.]+\.[a-z]{2,3}\.[a-z]{2})$/i,
        },
        ipv4: /^(?=\d+\.\d+\.\d+\.\d+$)(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.?){4}$/i,
        extensions: undefined
      }
    },
    searchEngines: undefined
  };

  function setSettings(theme, addressfieldMaskEl, addressfieldEl) {
    if (theme && typeof theme === 'string') {
      if (themeSettings[theme]) {
        enableDecodeURL = themeSettings[theme].decodeURL;
      }
      addressfieldMaskEl.classList.add(theme);
      addressfieldEl.classList.add(theme);
    }
  }

  function urlConvertEncodeHTML(urlConvert) {
    Object.keys(urlConvert).forEach(function (key) {
      urlConvert[key + 'HTML'] = gnoh.encode.html(urlConvert[key]);
    });
    return urlConvert;
  }

  function changeValue(addressfieldMaskEl, addressfieldEl, isChange) {
    if (addressfieldMaskEl.dataset.value !== addressfieldEl.value || isChange === true) {
      addressfieldMaskEl.dataset.value = addressfieldEl.value;
      addressfieldMaskEl.innerHTML = getURLColorEl(addressfieldEl.value);
    }
  }

  function createPatternSearchEngines(searchEngineCollection) {
    searchEngines = {
      default: undefined,
      defaultPrivate: undefined,
      engines: {}
    };
    pattern.searchEngines = undefined;
    const engines = searchEngineCollection.engines.filter(e => e.removed !== true);
    if (engines.length > 0) {
      const regKeywords = [];
      engines.forEach(function (engine) {
        searchEngines.engines[engine.keyword] = engine;
        searchEngines.engines[engine.keyword].keywordHTML = gnoh.encode.html(engine.keyword);
        searchEngines.engines[engine.keyword].nameHTML = gnoh.encode.html(engine.name);
        regKeywords.push(engine.keyword.replace(/[-/\\^$*+?.()|[]{}]/g, '\\$&'));

        if (engine.id === searchEngineCollection.default) {
          searchEngines.default = searchEngines.engines[engine.keyword];
        }
        if (engine.id === searchEngineCollection.defaultPrivate) {
          searchEngines.defaultPrivate = searchEngines.engines[engine.keyword];
        }
      });

      pattern.searchEngines = new RegExp('^(' + regKeywords.join('|') + ')\\s(.*)', 'i');
    }
  }

  function createPatternExtensions(extensionCollection, callback) {
    extensions = {};
    pattern.url.host.extensions = undefined;
    extensionCollection = extensionCollection.filter(e => e.enabled === true);
    if (extensionCollection.length > 0) {
      const regKeywords = [];
      extensionCollection.forEach(function (extension) {
        extensions[extension.id] = extension;
        extensions[extension.id].nameHTML = gnoh.encode.html(extension.name);
        regKeywords.push(extension.id);
      });

      pattern.url.host.extensions = new RegExp('^(?=[a-z]{32})(?:(' + regKeywords.join('|') + '))$', 'i');
    }
    if (typeof callback === 'function') {
      callback();
    }
  }

  function updatePatternExtensions(callback) {
    chrome.management.getAll(function (extensionCollection) {
      createPatternExtensions(extensionCollection, callback);
    });
  }

  chrome.storage.local.get({
    'SEARCH_ENGINE_COLLECTION': {
      engines: []
    }
  }, function (res) {
    createPatternSearchEngines(res.SEARCH_ENGINE_COLLECTION);
  });

  updatePatternExtensions();

  function createMask(addressfieldEl, addressfieldParentEl) {
    addressfieldParentEl = addressfieldParentEl || addressfieldEl.parentElement;
    const addressfieldMaskEl = gnoh.createElement('div', {
      class: addressfieldEl.className,
      placeholder: addressfieldEl.placeholder
    }, addressfieldParentEl);
    addressfieldMaskEl.classList.add('addressfield-mask');

    setSettings(theme, addressfieldMaskEl, addressfieldEl);
    changeValue(addressfieldMaskEl, addressfieldEl);

    chrome.storage.local.onChanged.addListener(function (changes, namespace) {
      if (changes.SEARCH_ENGINE_COLLECTION) {
        createPatternSearchEngines(changes.SEARCH_ENGINE_COLLECTION.newValue);
        changeValue(addressfieldMaskEl, addressfieldEl, true);
      }
    });

    ['onEnabled', 'onDisabled', 'onInstalled', 'onUninstalled'].forEach(function (event) {
      chrome.management[event].addListener(function () {
        updatePatternExtensions(function () {
          changeValue(addressfieldMaskEl, addressfieldEl, true);
        });
      });
    });

    gnoh.observeDOM(addressfieldEl, function (mutations, observer) {
      if (mutations[0].attributeName === 'value') {
        changeValue(addressfieldMaskEl, mutations[0].target);
      }
    }, { attributes: true });
  }

  function getURLColorEl(url) {
    const arr = pattern.url.full.exec(url);
    if (arr) {
      const urlConvert = urlConvertEncodeHTML({
        protocolSubFull: arr[1],
        protocolSub: arr[2],
        protocolFull: arr[3],
        protocol: arr[4],
        hostFull: arr[5],
        host: arr[6],
        postFull: arr[7],
        post: arr[8],
        path: arr[9],
        search: arr[10],
        hashFull: arr[11],
        hash: arr[12],
      });
      return [
        typeof urlConvert.protocolSub !== 'undefined' ? '<div class="protocol-sub" data-protocol-sub="' + urlConvert.protocolSubHTML + '">' + urlConvert.protocolSubHTML + '</div>' : '',
        typeof urlConvert.protocol !== 'undefined' ? '<div class="protocol" data-protocol="' + urlConvert.protocolHTML + '">' + urlConvert.protocolHTML + '</div>' : '',
        typeof urlConvert.hostFull !== 'undefined' ? [
          '<div class="host-full" data-host-full="' + urlConvert.hostFullHTML + '">',
          typeof urlConvert.host !== 'undefined' ? getURLHostEl(urlConvert.host, urlConvert) : '',
          typeof urlConvert.postFull !== 'undefined' ? '<div class="post" data-post="' + urlConvert.postHTML + '">' + urlConvert.postHTML + '</div>' : '',
          '</div>'
        ].join('') : '',
        (typeof urlConvert.path !== 'undefined' || typeof urlConvert.search !== 'undefined' || typeof urlConvert.hashFull !== 'undefined') ? [
          '<div class="path-full">',
          urlConvert.path === '/' ? '<div class="path" data-path="/"></div>' : typeof urlConvert.path !== 'undefined' ? '<div class="path" data-path="' + urlConvert.pathHTML + '">' + getURLPathEl(urlConvert.path) + '</div>' : '',
          urlConvert.search === '?' ? '<div class="search" data-search="?"></div>' : typeof urlConvert.search !== 'undefined' ? '<div class="search" data-search="' + urlConvert.searchHTML + '">' + getURLSearchEl(urlConvert.search) + '</div>' : '',
          typeof urlConvert.hashFull !== 'undefined' ? '<div class="hash" data-hash="' + urlConvert.hashFullHTML + '">' + (enableDecodeURL === true ? decodeURIComponent(urlConvert.hashHTML) : urlConvert.hashHTML) + '</div>' : '',
          '</div>'
        ].join('') : '',
      ].join('');
    } else {
      return url || '';
    }
  }

  function getURLHostEl(host, urlConvert) {
    if (host.match(pattern.url.host.hostSub.topLevel2)) {
      let hostSubHTML, hostMainHTML;
      return host.replace(pattern.url.host.hostSub.topLevel2, function (match, hostSubFull, hostSub, hostMain) {
        hostSubHTML = gnoh.encode.html(hostSub);
        hostMainHTML = gnoh.encode.html(hostMain);
        return [
          '<div class="host with-sub" data-host="' + urlConvert.hostHTML + '">',
          typeof hostSub !== 'undefined' ? '<div class="host-sub" data-host-sub="' + hostSubHTML + '">' + hostSubHTML + '</div>' : '',
          typeof hostMain !== 'undefined' ? '<div class="host-main" data-host-main="' + hostMainHTML + '">' + hostMainHTML + '</div>' : '',
          '</div>'
        ].join('');
      });
    } else if (host.match(pattern.url.host.hostSub.topLevel1)) {
      let hostSubHTML, hostMainHTML;
      return host.replace(pattern.url.host.hostSub.topLevel1, function (match, hostSubFull, hostSub, hostMain) {
        hostSubHTML = gnoh.encode.html(hostSub);
        hostMainHTML = gnoh.encode.html(hostMain);
        return [
          '<div class="host with-sub" data-host="' + urlConvert.hostHTML + '">',
          typeof hostSub !== 'undefined' ? '<div class="host-sub" data-host-sub="' + hostSubHTML + '">' + hostSubHTML + '</div>' : '',
          typeof hostMain !== 'undefined' ? '<div class="host-main" data-host-main="' + hostMainHTML + '">' + hostMainHTML + '</div>' : '',
          '</div>'
        ].join('');
      });
    } else if (pattern.searchEngines && host.match(pattern.searchEngines)) {
      let searchQueryHTML;
      return host.replace(pattern.searchEngines, function (match, searchNickname, searchQuery) {
        searchQueryHTML = gnoh.encode.html(searchQuery);
        return [
          '<div class="search-engine with-nickname">',
          typeof searchNickname !== 'undefined' ? '<div class="search-nickname" data-search-nickname="' + searchEngines.engines[searchNickname].keywordHTML + '" data-search-name="' + searchEngines.engines[searchNickname].nameHTML + '">' + searchEngines.engines[searchNickname].keywordHTML + '</div>' : '',
          typeof searchQuery !== 'undefined' ? '<div class="search-query" data-search-query="' + searchQueryHTML + '">' + (enableDecodeURL === true ? decodeURIComponent(searchQueryHTML) : searchQueryHTML) + '</div>' : '',
          '</div>'
        ].join('');
      });
    } else if (typeof urlConvert.protocol !== 'chrome-extension' && pattern.url.host.extensions && host.match(pattern.url.host.extensions)) {
      return '<div class="host extension" data-host="' + urlConvert.hostHTML + '"><div class="host-extension" data-host-extension="' + urlConvert.hostHTML + '" data-host-extension-name="' + extensions[host].nameHTML + '">' + urlConvert.hostHTML + '</div></div>';
    } else if (host.match(pattern.url.host.ipv4)) {
      return '<div class="host ipv4" data-host="' + urlConvert.hostHTML + '"><div class="host-main" data-host-main="' + urlConvert.hostHTML + '">' + urlConvert.hostHTML + '</div></div>';
    } else if (typeof urlConvert.protocolSub !== 'undefined' || typeof urlConvert.protocol !== 'undefined') {
      return '<div class="host other" data-host="' + urlConvert.hostHTML + '"><div class="host-other" data-host-other="' + urlConvert.hostHTML + '">' + urlConvert.hostHTML + '</div></div>';
    } else {
      const searchDefault = isPrivate ? searchEngines.defaultPrivate : searchEngines.default;
      return '<div class="search-engine default" data-search-nickname-default="' + searchDefault.keywordHTML + '" data-search-name-default="' + searchDefault.nameHTML + '"><div class="search-query" data-search-query="' + urlConvert.hostHTML + '">' + urlConvert.hostHTML + '</div></div>';
    }
  }

  function getURLPathEl(path) {
    let pathItemHTML;
    return path.replace(pattern.url.path, function (match, pathItem) {
      pathItemHTML = gnoh.encode.html(pathItem);
      return (typeof match !== 'undefined' ? '<div class="path-item" data-path-item="' + pathItemHTML + '">' + (enableDecodeURL === true ? decodeURIComponent(pathItemHTML) : pathItemHTML) + '</div>' : '');
    });
  }

  function getURLSearchEl(search) {
    let keyHTML, valueHTML;
    return search.replace(pattern.url.search, function (match, key, valueFull, value) {
      keyHTML = gnoh.encode.html(key);
      valueHTML = gnoh.encode.html(value);
      return [
        '<div class="search-item">',
        typeof key !== 'undefined' ? '<div class="search-key" data-search-key="' + keyHTML + '">' + (enableDecodeURL === true ? decodeURIComponent(keyHTML) : keyHTML) + '</div>' : '',
        typeof valueFull !== 'undefined' ? '<div class="search-value" data-search-value="' + valueHTML + '">' + (enableDecodeURL === true ? decodeURIComponent(valueHTML) : valueHTML) + '</div>' : '',
        '</div>'
      ].join('');
    });
  }

  gnoh.timeOut(function (addressfieldEl) {
    isPrivate = document.getElementById('browser').classList.contains('private');
    createMask(addressfieldEl);
    gnoh.override(HTMLElement.prototype, 'appendChild', function (element) {
      var key = gnoh.getReactEventHandlersKey(this);
      if (this[key] && this[key].className === 'UrlField' && element[key] && element[key].className.indexOf('url vivaldi-addressfield') > -1) {
        createMask(element, this);
      }
    });
  }, 'input.url.vivaldi-addressfield');
})();