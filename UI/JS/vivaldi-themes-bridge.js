/*
* Vivaldi Theme Bridge (05/15/26)
* For Vivaldi browser version 7.8 and up
* Authors: sudenim
* Forum link:
*
* Description: Creates a...bridge exposing vivaldi theme colours for extensions use
*
* GNU General Public License v3.0
*/
console.log('vivaldi-themes-bridge loaded');

var themeColors = null;

function buildColors() {
    const browser = document.querySelector('#browser');
    if (!browser) return null;
    const style = getComputedStyle(browser);
    const colorBg = style.getPropertyValue('--colorBg').trim();
    if (!colorBg) return null;
    return {
        colorBg:               colorBg,
        colorBgDark:           style.getPropertyValue('--colorBgDark').trim(),
        colorBgDarker:         style.getPropertyValue('--colorBgDarker').trim(),
        colorFg:               style.getPropertyValue('--colorFg').trim(),
        colorFgFaded:          style.getPropertyValue('--colorFgFaded').trim(),
        colorHighlightBg:      style.getPropertyValue('--colorHighlightBg').trim(),
        colorHighlightBgAlpha: style.getPropertyValue('--colorHighlightBgAlpha').trim()
    };
}

function injectIntoTab(tabId, colors) {
    chrome.scripting.executeScript({
        target: {tabId: tabId},
        func: function(c) {
            document.documentElement.style.setProperty('--colorBg', c.colorBg);
            document.documentElement.style.setProperty('--colorBgDark', c.colorBgDark);
            document.documentElement.style.setProperty('--colorBgDarker', c.colorBgDarker);
            document.documentElement.style.setProperty('--colorFg', c.colorFg);
            document.documentElement.style.setProperty('--colorFgFaded', c.colorFgFaded);
            document.documentElement.style.setProperty('--colorHighlightBg', c.colorHighlightBg);
            document.documentElement.style.setProperty('--colorHighlightBgAlpha', c.colorHighlightBgAlpha);
        },
        args: [colors]
    }, function() {
        if (chrome.runtime.lastError) {
            // silently ignore errors for invalid tabs
        }
    });
}

function injectIntoAllTabs() {
    if (!themeColors) return;
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
            if (tab.url && tab.url.indexOf('http') === 0) {
                injectIntoTab(tab.id, themeColors);
            }
        });
    });
}

function init() {
    const browser = document.querySelector('#browser');
    if (!browser) { setTimeout(init, 100); return; }
    const colors = buildColors();
    if (!colors) { setTimeout(init, 100); return; }
    themeColors = colors;
    console.log('theme ready');

    setTimeout(injectIntoAllTabs, 3000);

    const observer = new MutationObserver(function() {
        const newColors = buildColors();
        if (newColors && JSON.stringify(newColors) !== JSON.stringify(themeColors)) {
            themeColors = newColors;
            console.log('theme changed via observer');
            injectIntoAllTabs();
        }
    });
    observer.observe(browser, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        subtree: false
    });

    setInterval(function() {
        const newColors = buildColors();
        if (newColors && JSON.stringify(newColors) !== JSON.stringify(themeColors)) {
            themeColors = newColors;
            console.log('theme changed via poll');
            injectIntoAllTabs();
        }
    }, 1000);
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && tab.url.indexOf('http') === 0 && themeColors) {
        injectIntoTab(tabId, themeColors);
    }
});

init();