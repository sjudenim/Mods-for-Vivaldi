/*
 * Vivaldi Mini Media Player (05/10/26)
 * For Vivaldi browser version 7.9 and up
 * Author: sudenim and Tam710562
 *
 * Description: Adds a draggable mini player to a page when the media source is a background tab
 *
 * GNU General Public License v3.0
 */
(() => {
  console.log("Vivaldi Mini Player");

  // CONSTANTS
  // --------------------------------------------------
  const MESSAGE_TYPE = "vmp-media-controls";
  const HIDE_DELAY_MS = 3000;

  // STATE
  // --------------------------------------------------
  let lastAudioTime = 0;
  let lockedSource = null;
  let currentState = null;
  let dismissed = false;

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

  // ELEMENTS
  // --------------------------------------------------
  const playBtn = root.querySelector(".vmp-play");
  const titleEl = root.querySelector(".vmp-title");
  const artistEl = root.querySelector(".vmp-artist");
  const volInput = root.querySelector(".vmp-vol");
  const volumeBtn = root.querySelector(".vmp-volume-btn");

  // DRAG LOGIC
  // --------------------------------------------------
  let dragX = null, dragY = null;

  root.addEventListener('mousedown', e => {
    if (e.target.closest('button') || e.target.closest('.vmp-slider-wrap') || e.target.closest('.vmp-custom-slider')) return;
    dragX = e.clientX - root.getBoundingClientRect().left;
    dragY = e.clientY - root.getBoundingClientRect().top;
    root.style.transition = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (dragX === null) return;
    root.style.left = (e.clientX - dragX) + 'px';
    root.style.top = (e.clientY - dragY) + 'px';
    root.style.bottom = 'auto';
    root.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (dragX !== null) {
      const rect = root.getBoundingClientRect();
      if (rect.right + 120 > window.innerWidth) {
        root.style.right = (window.innerWidth - rect.right) + 'px';
        root.style.left = 'auto';
      }
    }
    dragX = null;
    dragY = null;
    root.style.transition = '';
  });

  // Expand from right edge when near viewport edge
  function checkFlip() {
    const rect = root.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    if (spaceRight < 160) {
      root.style.right = spaceRight + 'px';
      root.style.left = 'auto';
    } else {
      const currentRight = parseFloat(root.style.right);
      if (!isNaN(currentRight)) {
        root.style.left = (window.innerWidth - currentRight - root.offsetWidth) + 'px';
      }
      root.style.right = 'auto';
    }
  }

  // CUSTOM VOLUME SLIDER
  // --------------------------------------------------
  setTimeout(() => {
    const sliderWrap = root.querySelector('.vmp-slider-wrap');
    if (!sliderWrap) return;

    volInput.style.display = 'none';

    sliderWrap.insertAdjacentHTML('beforeend', `
    <div class="vmp-custom-slider">
      <div class="vmp-slider-fill"></div>
      <div class="vmp-slider-thumb"></div>
    </div>
  `);

    const slider = sliderWrap.querySelector('.vmp-custom-slider');
    const fill = slider.querySelector('.vmp-slider-fill');
    const thumb = slider.querySelector('.vmp-slider-thumb');

    root.__vmpSliderDragging = false;

    function updateSliderVisual(value) {
      const pct = Math.max(0, Math.min(value, 1)) * 100;
      fill.style.width = pct + '%';
      thumb.style.left = pct + '%';
    }

    updateSliderVisual(parseFloat(volInput.value) || 1);

    // Debounce sendMessage
    let sendTimer = null;
    function setVolumeFromMouse(clientX) {
      const rect = slider.getBoundingClientRect();
      const pos = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const volume = pos / rect.width;
      volInput.value = volume;
      updateSliderVisual(volume);
      updateVolumeIcon(volume);

      clearTimeout(sendTimer);
      sendTimer = setTimeout(() => applyVolume(volume), 50);
    }

    thumb.addEventListener('mousedown', e => {
      root.__vmpSliderDragging = true;
      e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
      if (root.__vmpSliderDragging) {
        root.__vmpSliderDragging = false;

        clearTimeout(sendTimer);
        applyVolume(parseFloat(volInput.value));
      }
    });

    document.addEventListener('mousemove', e => {
      if (root.__vmpSliderDragging) setVolumeFromMouse(e.clientX);
    });

    slider.addEventListener('click', e => setVolumeFromMouse(e.clientX));

    volInput.addEventListener('change', e => {
      if (!root.__vmpSliderDragging) updateSliderVisual(parseFloat(e.target.value));
    });
  }, 0);

  // HELPERS
  // --------------------------------------------------
  function updateVolumeIcon(volume) {
    const v = parseFloat(volume);
    if (v <= 0) volumeBtn.innerHTML = volumeIcons.off;
    else if (v < 0.5) volumeBtn.innerHTML = volumeIcons.medium;
    else volumeBtn.innerHTML = volumeIcons.high;
  }

  // Single source of truth for applying a volume value
  function applyVolume(newVol) {
    if (!currentState) return;
    volInput.value = newVol;
    updateVolumeIcon(newVol);

    // Keep custom slider fill/thumb in sync
    const fill = root.querySelector('.vmp-slider-fill');
    const thumb = root.querySelector('.vmp-slider-thumb');
    if (fill && thumb) {
      const pct = newVol * 100;
      fill.style.width = pct + '%';
      thumb.style.left = pct + '%';
    }

    chrome.tabs.sendMessage(
      currentState.tabId,
      { type: MESSAGE_TYPE, action: "volume", value: newVol },
      { frameId: currentState.frameId },
      () => { if (chrome.runtime.lastError) { /* tab may be gone */ } }
    );
  }

  // UPDATE UI
  // --------------------------------------------------
  function updateUI(data) {
    if (!data) return;
    currentState = data;

    // Title with CSS-only scroll
    let span = titleEl.querySelector("span");
    if (!span) {
      span = document.createElement("span");
      titleEl.innerHTML = "";
      titleEl.appendChild(span);
    }
    const titleText = data.title || "No media detected";
    span.textContent = titleText;
    span.setAttribute("data-text", titleText);

    titleEl.classList.toggle("scroll", titleText.length > 30);

    artistEl.textContent = data.artist || data.hostname || '';

    if (!root.__vmpSliderDragging) {
      applyVolume(data.volume ?? 1);
    }
    playBtn.textContent = data.paused ? "❚❚" : "▶";
  }

  // CONTROLS
  // --------------------------------------------------
  playBtn.addEventListener('click', () => {
    if (!currentState) return;
    chrome.tabs.sendMessage(
      currentState.tabId,
      { type: MESSAGE_TYPE, action: currentState.paused ? "play" : "pause" },
      { frameId: currentState.frameId },
      () => { if (chrome.runtime.lastError) { /* tab may be gone */ } }
    );
  });

  volInput.addEventListener('input', e => {
    applyVolume(parseFloat(e.target.value));
  });

  volumeBtn.addEventListener('click', () => {
    if (!currentState) return;
    applyVolume(parseFloat(volInput.value) === 0 ? 1 : 0);
  });

  // MAIN INJECTION
  // --------------------------------------------------
  function injectMain(messageType) {
    if (window.__vmpMainInjected) return;
    window.__vmpMainInjected = true;

    let currentMedia = null;

    // Grab the original addEventListener once from EventTarget
    const origAddEventListener = EventTarget.prototype.addEventListener;
    const origVideoPlay = HTMLVideoElement.prototype.play;
    const origAudioPlay = HTMLAudioElement.prototype.play;

    HTMLVideoElement.prototype.play = function () {
      if (!this.__vmpTracked) trackElement(this);
      return origVideoPlay.apply(this, arguments);
    };

    HTMLAudioElement.prototype.play = function () {
      if (!this.__vmpTracked) trackElement(this);
      return origAudioPlay.apply(this, arguments);
    };

    HTMLVideoElement.prototype.addEventListener = function () {
      if (!this.__vmpTracked) trackElement(this);
      return origAddEventListener.apply(this, arguments);
    };

    HTMLAudioElement.prototype.addEventListener = function () {
      if (!this.__vmpTracked) trackElement(this);
      return origAddEventListener.apply(this, arguments);
    };

    function getTitle() { return navigator.mediaSession.metadata?.title || document.title || null; }
    function getArtist() { return navigator.mediaSession.metadata?.artist || null; }

    function isActive(el) { return !el.paused && !el.ended && el.readyState >= 2; }

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
        currentMedia = event.target;
        emit(currentMedia);
      }
    }

    function pauseHandler(event) {
      if (!hasMediaPlaying()) {
        currentMedia = event.target;
        emit(currentMedia);
      }
    }

    function volumechangeHandler(event) {
      if (currentMedia === event.target) emit(currentMedia);
    }

    function endedHandler() {
      if (!hasMediaPlaying()) {
        currentMedia = null;
        window.postMessage({ type: messageType, data: { ended: true } }, '*');
      }
    }

    function trackElement(el) {
      if (el.__vmpTracked) return;
      el.__vmpTracked = true;

      origAddEventListener.call(el, 'play', timeupdateHandler);
      origAddEventListener.call(el, 'playing', timeupdateHandler);
      origAddEventListener.call(el, 'timeupdate', timeupdateHandler);
      origAddEventListener.call(el, 'pause', pauseHandler);
      origAddEventListener.call(el, 'volumechange', volumechangeHandler);
      origAddEventListener.call(el, 'ended', endedHandler);
      origAddEventListener.call(el, 'error', endedHandler);
    }

    function trackExisting() {
      document.querySelectorAll('video, audio').forEach(el => trackElement(el));
    }

    trackExisting();

    const observer = new MutationObserver(trackExisting);
    observer.observe(document, { childList: true, subtree: true });

    // Listen for commands forwarded from the bridge
    window.addEventListener('message', event => {
      if (!event.data || event.data.type !== messageType + '-cmd') return;
      if (!currentMedia) return;
      const { action, value } = event.data;
      if (action === 'play') currentMedia.play();
      else if (action === 'pause') currentMedia.pause();
      else if (action === 'volume') {
        currentMedia.volume = Math.max(0, Math.min(1, parseFloat(value)));
        currentMedia.muted = false;
      }
    });
  }

  // BRIDGE
  // --------------------------------------------------
  function injectBridge(messageType) {
    if (window.__vmpBridgeInjected) return;
    window.__vmpBridgeInjected = true;

    // Page → extension
    window.addEventListener('message', event => {
      if (!event.data || event.data.type !== messageType) return;
      chrome.runtime.sendMessage(event.data);
    });

    // Extension → page
    chrome.runtime.onMessage.addListener(msg => {
      if (!msg || msg.type !== messageType) return;
      window.postMessage({ type: messageType + '-cmd', action: msg.action, value: msg.value }, '*');
    });
  }

  // TAB INJECTION
  // --------------------------------------------------
  function injectIntoTab(tabId, frameIds) {
    const target = frameIds
      ? { tabId, frameIds }
      : { tabId, allFrames: true };

    chrome.scripting.executeScript({
      target, func: injectMain, args: [MESSAGE_TYPE], world: 'MAIN'
    }, () => { if (chrome.runtime.lastError) { /* tab may not be scriptable */ } });

    chrome.scripting.executeScript({
      target, func: injectBridge, args: [MESSAGE_TYPE]
    }, () => { if (chrome.runtime.lastError) { /* tab may not be scriptable */ } });
  }

  function injectIntoAllTabs() {
    chrome.tabs.query({}, tabs => {
      for (const tab of tabs) {
        if (tab.id) injectIntoTab(tab.id);
      }
    });
  }

  injectIntoAllTabs();

  chrome.webNavigation.onCommitted.addListener(details => {
    injectIntoTab(details.tabId, [details.frameId]);
  });

  // MESSAGE HANDLER
  // --------------------------------------------------
  chrome.runtime.onMessage.addListener((msg, sender) => {
    if (!msg || msg.type !== MESSAGE_TYPE) return;
    if (!msg.data || !sender.tab) return;

    const tabId = sender.tab.id;
    const frameId = sender.frameId;

    const tabEl = document.querySelector(`.tab-wrapper[data-id="tab-${tabId}"] .tab`);
    const isAudioOn = tabEl?.classList.contains("audio-on");

    // Ignore tabs with no audio indicator
    if (!isAudioOn) return;

    // Keep lock on current source unless it has lost its audio indicator
    if (lockedSource && lockedSource.tabId !== tabId) {
      const lockedTabEl = document.querySelector(`.tab-wrapper[data-id="tab-${lockedSource.tabId}"] .tab`);
      const lockedActive = lockedTabEl?.classList.contains("audio-on");
      if (lockedActive) return;
    }

    lockedSource = { tabId, frameId };
    msg.data.tabId = tabId;
    msg.data.frameId = frameId;
    msg.data.hostname = sender.tab?.url ? new URL(sender.tab.url).hostname : '';
    updateUI(msg.data);
  });

  chrome.tabs.onRemoved.addListener(tabId => {
    if (lockedSource?.tabId === tabId) lockedSource = null;
  });

  // PLAYER VISIBILITY
  // --------------------------------------------------
  function updateMiniPlayerVisibility() {
    const playingTab = document.querySelector(".tab-position .tab.audio-on");
    const activeTab = document.querySelector(".tab-position .tab.active");
    const isBackgroundTab = playingTab && playingTab !== activeTab;

    if (isBackgroundTab) {
      lastAudioTime = Date.now();
    } else {
      dismissed = false;
    }

    const keepVisible = (Date.now() - lastAudioTime) < HIDE_DELAY_MS;
    const shouldShow = (isBackgroundTab && !dismissed) || (!isBackgroundTab && keepVisible);

    root.classList.toggle("visible", shouldShow);
  }

  // Prefer event-driven updates; fall back to a conservative poll interval
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if ('audible' in changeInfo) updateMiniPlayerVisibility();
  });

  chrome.tabs.onActivated.addListener(() => {
    dismissed = false;
    updateMiniPlayerVisibility();
  });

  // Interval fall back
  setInterval(updateMiniPlayerVisibility, 500);
  updateMiniPlayerVisibility();

  // Dismiss on double-click
  root.addEventListener('dblclick', () => { dismissed = true; });

  setTimeout(checkFlip, 100);
})();
