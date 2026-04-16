(function () {
  let timer = null;

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && timer === null) {
      timer = setTimeout(async () => {
        try {
          const window = await chrome.windows.getCurrent();
          const tabCapture = await chrome.tabs.captureVisibleTab(window.id);

          const vivExtData = JSON.parse(tab.vivExtData);
          vivExtData.thumbnail = tabCapture;

          await chrome.tabs.update(tabId, {
            vivExtData: JSON.stringify(vivExtData),
          });
        } catch (error) {
          console.error(error);
        } finally {
          timer = null;
        }
      }, chrome.tabs.MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND * 1000);
    }
  });
})();
