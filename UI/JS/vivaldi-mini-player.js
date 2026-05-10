/*
* Vivaldi Mini Media Player (05/08/26)
* For Vivaldi browser version 7.8 and up
* Author: sudenim and Tam710562
*
* Description: Adds a mini player to the bottom of a page when media source is a background tab
*
* GNU General Public License v3.0
*/

(() => {
  console.log("Vivaldi Mini Player");

  const messageType = "vmp-media-controls";
  let lastAudioTime = 0;
  let lockedSource = null;

  // VOLUME ICONS
  // --------------------------------------------------
  const volumeIcons = {
    high: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/></svg>`,
    medium: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M5,9V15H9L14,20V4L9,9M18.5,12C18.5,10.23 17.5,8.71 16,7.97V16C17.5,15.29 18.5,13.76 18.5,12Z"/></svg>`,
    off: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z"/></svg>`
  };

  // UI LAYOUT
  // --------------------------------------------------
  const root = document.createElement("div");
  root.id = "vmp";
  root.innerHTML = `
    <div class="vmp-bar">
      <button class="vmp-play">▶</button>
      <div class="vmp-info">
        <div class="vmp-title">No media detected</div>
        <div class="vmp-artist"></div>
      </div>
      <div class="vmp-volume">
        <button class="vmp-volume-btn">${volumeIcons.high}</button>
        <div class="vmp-slider-wrap">
          <input class="vmp-vol" type="range" min="0" max="1" step="0.01">
        </div>
      </div>
    </div>
  `;
  (document.body || document.documentElement).appendChild(root);

// DRAGGABLE PLAYER
// --------------------------------------------------
let dragX = null, dragY = null;

root.addEventListener('mousedown', e => {
  // Don't drag if clicking buttons or slider
  if (e.target.closest('button') || e.target.closest('.vmp-slider-wrap') || e.target.closest('.vmp-custom-slider')) return;
  dragX = e.clientX - root.getBoundingClientRect().left;
  dragY = e.clientY - root.getBoundingClientRect().top;
  root.style.transition = 'none';
  e.preventDefault();
});

document.addEventListener('mouseup', () => {
  dragX = null;
  dragY = null;
  root.style.transition = '';
});

document.addEventListener('mousemove', e => {
  if (dragX === null) return;
  const x = e.clientX - dragX;
  const y = e.clientY - dragY;
  root.style.left = x + 'px';
  root.style.top = y + 'px';
  root.style.transform = 'none';
  root.style.bottom = 'auto';
});

  // CUSTOMIZABLE VOLUME SLIDER
  // --------------------------------------------------
  setTimeout(() => {
    const vol = root.querySelector('.vmp-vol');
    const sliderWrap = root.querySelector('.vmp-slider-wrap');
    if (!vol || !sliderWrap) return;

    sliderWrap.insertAdjacentHTML('beforeend', `
      <div class="vmp-custom-slider">
        <div class="vmp-slider-fill"></div>
        <div class="vmp-slider-thumb"></div>
      </div>
    `);

    const slider = sliderWrap.querySelector('.vmp-custom-slider');
    const fill = slider.querySelector('.vmp-slider-fill');
    const thumb = slider.querySelector('.vmp-slider-thumb');
    let dragging = false;

    function updateSlider(volValue) {
      const pct = volValue * 100;
      fill.style.width = pct + '%';
      thumb.style.left = pct + '%';
    }

    updateSlider(parseFloat(vol.value) || 1);

    function setVolumeFromMouse(x) {
      const rect = slider.getBoundingClientRect();
      let pos = x - rect.left;
      pos = Math.max(0, Math.min(pos, rect.width));
      const volume = pos / rect.width;
      vol.value = volume;
      vol.oninput({ target: { value: volume } });
      updateSlider(volume);
    }

    thumb.addEventListener('mousedown', e => { dragging = true; e.preventDefault(); });
    document.addEventListener('mouseup', () => dragging = false);
    document.addEventListener('mousemove', e => { if (dragging) setVolumeFromMouse(e.clientX); });
    slider.addEventListener('click', e => setVolumeFromMouse(e.clientX));
    vol.addEventListener('input', e => updateSlider(parseFloat(e.target.value)));
  }, 0);

  // ELEMENTS
  // --------------------------------------------------
  const playBtn = root.querySelector(".vmp-play");
  const titleEl = root.querySelector(".vmp-title");
  const artistEl = root.querySelector(".vmp-artist");
  const timeEl = root.querySelector(".vmp-time");
  const vol = root.querySelector(".vmp-vol");
  const volumeBtn = root.querySelector(".vmp-volume-btn");
  let currentState = null;

  function fmt(t) {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function updateVolumeIcon(volume) {
    const volNum = parseFloat(volume);
    if (volNum <= 0) volumeBtn.innerHTML = volumeIcons.off;
    else if (volNum < 0.5) volumeBtn.innerHTML = volumeIcons.medium;
    else volumeBtn.innerHTML = volumeIcons.high;
  }

  // UPDATE UI
  // --------------------------------------------------
  function updateUI(data) {
    if (!data) return;
    currentState = data;

    let span = titleEl.querySelector("span");
    if (!span) {
      span = document.createElement("span");
      titleEl.innerHTML = "";
      titleEl.appendChild(span);
    }
    span.textContent = data.title || "No media detected";
    span.setAttribute("data-text", data.title || "No media detected");

    const temp = document.createElement("span");
    temp.style.position = "absolute";
    temp.style.visibility = "hidden";
    temp.style.whiteSpace = "nowrap";
    temp.style.fontSize = window.getComputedStyle(span).fontSize;
    temp.textContent = span.textContent;
    document.body.appendChild(temp);
    const textWidth = temp.offsetWidth;
    document.body.removeChild(temp);

    if (textWidth > titleEl.clientWidth) titleEl.classList.add("scroll");
    else titleEl.classList.remove("scroll");

    artistEl.textContent = data.artist || data.hostname || '';
    vol.value = data.volume ?? 1;
    updateVolumeIcon(vol.value);

    const fill = root.querySelector('.vmp-slider-fill');
    const thumb = root.querySelector('.vmp-slider-thumb');
    if (fill && thumb) {
      const pct = parseFloat(vol.value) * 100;
      fill.style.width = pct + '%';
      thumb.style.left = pct + '%';
    }

    playBtn.textContent = data.paused ? "❚❚" : "▶";
  }

  // PLAY / PAUSE
  // --------------------------------------------------
  playBtn.onclick = () => {
    if (!currentState) return;
    chrome.tabs.sendMessage(
      currentState.tabId,
      { type: messageType, action: currentState.paused ? "play" : "pause" },
      { frameId: currentState.frameId }
    );
  };

  // VOLUME
  // --------------------------------------------------
  vol.oninput = (e) => {
    if (!currentState) return;
    const newVol = parseFloat(e.target.value);
    chrome.tabs.sendMessage(
      currentState.tabId,
      { type: messageType, action: "volume", value: newVol },
      { frameId: currentState.frameId }
    );
    updateVolumeIcon(newVol);
  };

  volumeBtn.onclick = () => {
    if (!currentState) return;
    const newVolume = parseFloat(vol.value) === 0 ? 1 : 0;
    vol.value = newVolume;
    chrome.tabs.sendMessage(
      currentState.tabId,
      { type: messageType, action: "volume", value: newVolume },
      { frameId: currentState.frameId }
    );
    updateVolumeIcon(newVolume);
  };

  // MEDIA SOURCE DETECTION
  // --------------------------------------------------
  function injectMain(messageType) {
    if (window.__vmpMainInjected) return;
    window.__vmpMainInjected = true;

    let currentVideo = null;

    const playVideoOriginal = HTMLVideoElement.prototype.play;
    HTMLVideoElement.prototype.play = function () {
      if (!this.__vmpTracked) addEventListeners(this);
      return playVideoOriginal.apply(this, arguments);
    };

    const playAudioOriginal = HTMLAudioElement.prototype.play;
    HTMLAudioElement.prototype.play = function () {
      if (!this.__vmpTracked) addEventListeners(this);
      return playAudioOriginal.apply(this, arguments);
    };

    const addEventListenerVideoOriginal = HTMLVideoElement.prototype.addEventListener;
    HTMLVideoElement.prototype.addEventListener = function () {
      if (!this.__vmpTracked) addEventListeners(this);
      return addEventListenerVideoOriginal.apply(this, arguments);
    };

    const addEventListenerAudioOriginal = HTMLAudioElement.prototype.addEventListener;
    HTMLAudioElement.prototype.addEventListener = function () {
      if (!this.__vmpTracked) addEventListeners(this);
      return addEventListenerAudioOriginal.apply(this, arguments);
    };

    function getTitle() {
      return navigator.mediaSession.metadata?.title || document.title || null;
    }

    function getArtist() {
      return navigator.mediaSession.metadata?.artist || null;
    }

    function isActive(el) {
      return !el.paused && !el.ended && el.readyState >= 2;
    }

    function hasMediaPlaying() {
      return Array.from(document.querySelectorAll('video, audio')).find(el => isActive(el));
    }

    function getDataControl(el) {
      return {
        type: messageType,
        title: getTitle(),
        artist: getArtist(),
        currentTime: el.currentTime,
        duration: el.duration,
        paused: el.paused,
        volume: el.muted ? 0 : el.volume,
        muted: el.muted,
      };
    }

    function emit(el) {
      window.postMessage({ type: messageType, data: getDataControl(el) }, '*');
    }

    function timeupdateHandler(event) {
      if (!event.target.paused) {
        currentVideo = event.target;
        emit(currentVideo);
      }
    }

    function pauseHandler(event) {
      if (!hasMediaPlaying()) {
        currentVideo = event.target;
        emit(currentVideo);
      }
    }

    function volumechangeHandler(event) {
      if (currentVideo === event.target) {
        emit(currentVideo);
      }
    }

    function endedHandler(event) {
      if (!hasMediaPlaying()) {
        currentVideo = null;
        window.postMessage({ type: messageType, data: { ended: true } }, '*');
      }
    }

    function addEventListeners(el) {
      if (el.__vmpTracked) return;
      el.__vmpTracked = true;

      addEventListenerAudioOriginal.apply(el, ['play', timeupdateHandler]);
      addEventListenerAudioOriginal.apply(el, ['playing', timeupdateHandler]);
      addEventListenerAudioOriginal.apply(el, ['timeupdate', timeupdateHandler]);
      addEventListenerAudioOriginal.apply(el, ['pause', pauseHandler]);
      addEventListenerAudioOriginal.apply(el, ['volumechange', volumechangeHandler]);
      addEventListenerAudioOriginal.apply(el, ['ended', endedHandler]);
      addEventListenerAudioOriginal.apply(el, ['error', endedHandler]);
    }

    function injectExisting() {
      document.querySelectorAll('video, audio').forEach(el => addEventListeners(el));
    }

    injectExisting();
    new MutationObserver(() => injectExisting()).observe(document, { childList: true, subtree: true });

    // Listen commands for BRIDGE
    window.addEventListener('message', (event) => {
      if (!event.data || event.data.type !== messageType + '-cmd') return;
      const { action, value } = event.data;
      if (!currentVideo) return;
      if (action === 'play') currentVideo.play();
      else if (action === 'pause') currentVideo.pause();
      else if (action === 'volume') {
        currentVideo.volume = Math.max(0, Math.min(1, parseFloat(value)));
        currentVideo.muted = false;
      }
    });
  }

  // BRIDGE
  // Forwards chrome.runtime messages
  // --------------------------------------------------
  function injectBridge(messageType) {
    if (window.__vmpBridgeInjected) return;
    window.__vmpBridgeInjected = true;

    // Forward main world media events to chrome.runtime
    window.addEventListener('message', (event) => {
      if (!event.data || event.data.type !== messageType) return;
      chrome.runtime.sendMessage(event.data);
    });

    // Forward chrome.runtime commands to main world
    chrome.runtime.onMessage.addListener((msg) => {
      if (!msg || msg.type !== messageType) return;
      window.postMessage({ type: messageType + '-cmd', action: msg.action, value: msg.value }, '*');
    });
  }

  // INJECT INTO TABS
  // --------------------------------------------------
  function injectIntoAllTabs() {
    chrome.tabs.query({}, tabs => {
      for (const tab of tabs) {
        if (!tab.id) continue;
        chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          func: injectMain,
          args: [messageType],
          world: 'MAIN'
        });
        chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          func: injectBridge,
          args: [messageType]
        });
      }
    });
  }
  injectIntoAllTabs();

  chrome.webNavigation.onCommitted.addListener(details => {
    chrome.scripting.executeScript({
      target: { tabId: details.tabId, frameIds: [details.frameId] },
      func: injectMain,
      args: [messageType],
      world: 'MAIN'
    });
    chrome.scripting.executeScript({
      target: { tabId: details.tabId, frameIds: [details.frameId] },
      func: injectBridge,
      args: [messageType]
    });
  });

  // TAB MEDIA SOURCE CONTROLLER
  // --------------------------------------------------
  chrome.runtime.onMessage.addListener((msg, sender) => {
    if (!msg || msg.type !== messageType) return;
    if (msg.data && sender.tab) {
      const tabId = sender.tab.id;
      const frameId = sender.frameId;

      const tabEl = document.querySelector(`.tab-wrapper[data-id="tab-${tabId}"] .tab`);
      const isAudioOn = tabEl?.classList.contains("audio-on");

      // Ignore tabs with no audio
      if (!isAudioOn) return;

      // Only switch sources if the current lock has no audio-on
      if (lockedSource) {
        const lockedTabEl = document.querySelector(`.tab-wrapper[data-id="tab-${lockedSource.tabId}"] .tab`);
        const lockedAudioOn = lockedTabEl?.classList.contains("audio-on");
        if (lockedAudioOn && lockedSource.tabId !== tabId) return;
      }

      lockedSource = { tabId, frameId };
      msg.data.tabId = tabId;
      msg.data.frameId = frameId;
      msg.data.hostname = sender.tab?.url ? new URL(sender.tab.url).hostname : '';
      updateUI(msg.data);
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    if (lockedSource && lockedSource.tabId === tabId) {
      lockedSource = null;
    }
  });

  // MINI PLAYER VISIBILITY
  // --------------------------------------------------
  let dismissed = false;

  root.addEventListener('dblclick', () => {
    dismissed = true;
  });

  function updateMiniPlayerVisibility() {
    const playingTab = document.querySelector(".tab-position .tab.audio-on");
    const activeTab = document.querySelector(".tab-position .tab.active");
    const isBackgroundTab = playingTab && playingTab !== activeTab;

    if (isBackgroundTab) {
      lastAudioTime = Date.now();
    } else {
      dismissed = false;
    }

    const keepVisible = (Date.now() - lastAudioTime) < 3000;
    const shouldShow = (isBackgroundTab && !dismissed) || (!isBackgroundTab && keepVisible);

    if (shouldShow) root.classList.add("visible");
    else root.classList.remove("visible");
  }

  setInterval(updateMiniPlayerVisibility, 500);
  updateMiniPlayerVisibility();

})();