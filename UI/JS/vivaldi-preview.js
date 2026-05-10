/*
* Vivaldi Preview (05/03/26)
* For Vivaldi browser version 7.8 and up
* Authors: biruktes, tam710562, oudstand, sudenim
* Forum link: https://forum.vivaldi.net/topic/92501/open-in-preview-mod?_=1717490394230
*
* Description: Opens a preview window for links
*
* GNU General Public License v3.0
*/
(() => {
    const UI_CONFIG = {
        showUrlInput: false // true = shows the URL input in the options container, false = title + buttons only
    },
        ICON_CONFIG = {
            linkIcon: '', // if set, an icon shows up after links - example values 'fa-solid fa-up-right-from-square', 'fa-solid fa-circle-info', 'fa-regular fa-square' search for other icons: https://fontawesome.com/search?o=r&ic=free&s=solid&ip=classic
            linkIconInteractionOnHover: true, // if false, you have to click the icon to show the dialog - if true, the dialog shows on mouseenter
            showIconDelay: 250, // set to 0 to disable - delays showing the icon on hovering a link
            showDialogOnHoverDelay: 250 // set to 0 to disable - delays showing the dialog on hovering the linkIcon
        },
        CONTEXT_MENU_CONFIG = {
            linkMenuTitle: 'Open in Preview',
            searchMenuTitle: 'Search in Preview',
            selectSearchMenuTitle: 'Select Search for Preview'
        },
        TOOLTIP_CONFIG = {
            back: 'Back',
            forward: 'Forward',
            reload: 'Reload',
            readerView: 'Reader View',
            newTab: 'Open in New Tab',
            backgroundTab: 'Open in Background Tab'
        },
        TIMING_CONFIG = {
            middleClickDelay: 500,
            titleFetchDelay: 300
        };

    // Wait for the browser to come to a ready state
    setTimeout(function waitDialog() {
        const browser = document.getElementById('browser');
        if (!browser) {
            return setTimeout(waitDialog, 300);
        }
        new DialogMod();
    }, 300);

    class DialogLifetime {
        #controller = new AbortController();
        #cleanupFns = [];
        #disposed = false;

        get signal() {
            return this.#controller.signal;
        }

        add(cleanupFn) {
            if (this.#disposed) {
                cleanupFn();
                return;
            }

            this.#cleanupFns.push(cleanupFn);
        }

        dispose() {
            if (this.#disposed) return;
            this.#disposed = true;

            this.#controller.abort();

            for (const cleanupFn of this.#cleanupFns.splice(0)) {
                cleanupFn();
            }
        }
    }

    class DialogMod {
        // Animation constants
        ANIMATION_DURATIONS = {
            CLOSE_TIMEOUT: 800, // Fallback timeout for close animation
            OPTIONS_FADE: 300, // Fade timing for swapping title and options
            OPTIONS_HIDE: 1500 // Options container hide delay
        };

        // Cached canvas context for text measurement (performance optimization)
        #canvasContext = document.createElement('canvas').getContext('2d');

        webviews = new Map();
        iconUtils = new IconUtils();
        searchEngineUtils = new SearchEngineUtils(
            url => this.dialogTab(url),
            (engineId, searchText) => this.dialogTabSearch(engineId, searchText),
            CONTEXT_MENU_CONFIG
        );
        KEYBOARD_SHORTCUTS = {
            'Ctrl+Alt+Period': this.searchForSelectedText.bind(this),
            'Ctrl+Shift+F': this.searchForSelectedText.bind(this),
            Esc: () => {
                if (!this.webviews.size) return;

                const webviewValues = Array.from(this.webviews.values());
                let webviewData = webviewValues.at(-1);
                if (!webviewData.fromPanel) {
                    const tabId = Number(this.getActiveWebview()?.tab_id);
                    webviewData = webviewValues.findLast(_data => _data.tabId === tabId);
                }
                webviewData && this.removeDialog(webviewData.webview.id);
            }
        };
        constructor() {
            vivaldi.prefs?.onChanged?.addListener?.(event => {
                if (event?.path !== ReaderView.STYLE_PREF) return;

                ReaderView.syncOpenViews();
            });

            // Setup keyboard shortcuts
            vivaldi.tabsPrivate.onKeyboardShortcut.addListener(this.keyCombo.bind(this));

            new WebviewLinkInteractionUtils(
                webview => this.getWebviewFromPanel(webview),
                (url, fromPanel, origin) => this.dialogTab(url, fromPanel, origin),
                TIMING_CONFIG
            );

            if (ICON_CONFIG.linkIcon) {
                new WebsiteInjectionUtils(
                    navigationDetails => this.getWebviewConfig(navigationDetails),
                    (url, fromPanel, origin) => this.dialogTab(url, fromPanel, origin),
                    ICON_CONFIG,
                    TIMING_CONFIG
                );
            }
        }

        /**
         * Finds the correct configuration for showing the dialog
         */
        getWebviewConfig(navigationDetails) {
            const isSubFrame = navigationDetails.frameId && navigationDetails.frameId !== 0,
                isNonOutermostFrame = navigationDetails.frameType && navigationDetails.frameType !== 'outermost_frame';
            if (isSubFrame || isNonOutermostFrame) return {webview: null, fromPanel: false};

            // first dialog from tab or webpanel
            let webview = document.querySelector(`webview[tab_id="${navigationDetails.tabId}"]`);
            if (webview) return {webview, fromPanel: this.getWebviewFromPanel(webview)};

            // follow-up dialog from the webpanel
            webview = Array.from(this.webviews.values()).find(view => view.fromPanel)?.webview;
            if (webview) return {webview, fromPanel: true};

            // follow-up dialog from tab
            const lastWebviewId = document.querySelector('.active.visible.webpageview .dialog-container:last-of-type webview')?.id;
            return {webview: this.webviews.get(lastWebviewId)?.webview, fromPanel: false};
        }

        getWebviewFromPanel(webview) {
            return this.webviews.get(webview.id)?.fromPanel ?? webview.name === 'vivaldi-webpanel';
        }

        getActiveWebview() {
            return document.querySelector('.active.visible.webpageview webview');
        }

        /**
         * Open Default Search Engine in Dialog and search for the selected text
         * @returns {Promise<void>}
         */
        async searchForSelectedText() {
            const tabs = await chrome.tabs.query({active: true});
            vivaldi.utilities.getSelectedText(tabs[0].id, text => this.dialogTabSearch(this.searchEngineUtils.defaultSearchId, text));
        }

        /**
         * Prepares url for search, calls dialogTab function
         * @param {String} engineId engine id of the engine to be used
         * @param {int} selectionText the text to search
         */
        async dialogTabSearch(engineId, selectionText) {
            let searchRequest = await vivaldi.searchEngines.getSearchRequest(engineId, selectionText);
            this.dialogTab(searchRequest.url);
        }

        /**
         * Handle a potential keyboard shortcut (copy from KeyboardMachine)
         * @param {number} id I don't know what this does, but it's an extra argument
         * @param {String} combination written in the form (CTRL+SHIFT+ALT+KEY)
         */
        keyCombo(id, combination) {
            const customShortcut = this.KEYBOARD_SHORTCUTS[combination];
            if (customShortcut) {
                customShortcut();
            }
        }

        cleanupDialog(webviewId) {
            const data = this.webviews.get(webviewId);
            if (!data) return;

            data.lifetime?.dispose();
        }

        removeAssociatedTab(webviewId) {
            const tabId = this.webviews.get(webviewId)?.relatedTabId;
            if (!tabId) return;

            chrome.tabs.remove(tabId);
        }

        /**
         * Removes the dialog for a given webview
         * @param webviewId The id of the webview
         */
        removeDialog(webviewId) {
            const data = this.webviews.get(webviewId);
            if (!data) return;

            const container = data.divContainer;
            const dialogTab = container.querySelector('.dialog-tab');
            const lifetime = data.lifetime;

            if (container.dataset.closing === '1') return;
            container.dataset.closing = '1';

            const pointerX = Number(container.dataset.pointerX ?? window.innerWidth / 2);
            const pointerY = Number(container.dataset.pointerY ?? window.innerHeight / 2);

            // Recompute anchored translate for current layout
            this.setAnchoredTransformVars(dialogTab, pointerX, pointerY);

            requestAnimationFrame(() => {
                container.classList.remove('is-open'); // overlay fades out via transition
                container.classList.add('is-leave'); // optional: block clicks

                dialogTab.classList.add('animating-close');

                let removalFinished = false;
                const finishRemoval = () => {
                    if (removalFinished) return;
                    removalFinished = true;

                    container.classList.remove('is-leave');
                    this.cleanupDialog(webviewId);
                    data.divContainer.remove();

                    this.webviews.delete(webviewId);
                };

                const onCloseEnd = e => {
                    if (e.animationName === 'dialog-tab-close-anchored') {
                        finishRemoval();
                    }
                };
                dialogTab.addEventListener('animationend', onCloseEnd, {signal: lifetime.signal});

                // Fallback in case animationend doesn't fire
                const closeFallback = setTimeout(finishRemoval, this.ANIMATION_DURATIONS.CLOSE_TIMEOUT);
                lifetime.add(() => clearTimeout(closeFallback));
            });
        }

        /**
         * Checks if the current window is the correct window to show the dialog and then opens the dialog
         * @param {string} linkUrl the url to load
         * @param {boolean} fromPanel indicates whether the dialog is opened from a panel
         * @param {{x:number, y:number}} origin the viewport coordinates to anchor the animation
         */
        dialogTab(linkUrl, fromPanel = undefined, origin = undefined) {
            chrome.windows.getLastFocused(window => {
                if (window.id === vivaldiWindowId && window.state !== chrome.windows.WindowState.MINIMIZED) {
                    this.showDialog(linkUrl, fromPanel, origin); // pass origin through
                }
            });
        }

        /**
         * Opens a link in a dialog like display in the current visible tab
         * @param {string} linkUrl the url to load
         * @param {boolean} fromPanel indicates whether the dialog is opened from a panel
         * @param {{x:number, y:number}} origin the viewport coordinates to anchor the animation
         */
        showDialog(linkUrl, fromPanel, origin) {
            const dialogContainer = document.createElement('div'),
                dialogTab = document.createElement('div'),
                webview = document.createElement('webview'),
                webviewId = `dialog-${this.getWebviewId()}`,
                progressBar = new ProgressBar(webviewId),
                lifetime = new DialogLifetime(),
                optionsContainer = document.createElement('div'),
                readerView = new ReaderView({
                    sourceWebview: webview,
                    signal: lifetime.signal,
                    settingsIcon: IconUtils.SVG.settings,
                    onNavigate: url => this.navigateWebview(webview, url)
                });

            if (fromPanel === undefined && this.webviews.size !== 0) {
                fromPanel = Array.from(this.webviews.values()).at(-1).fromPanel;
            }

            const activeWebview = this.getActiveWebview();
            const tabId = !fromPanel && activeWebview ? Number(activeWebview.tab_id) : null;

            this.webviews.set(webviewId, {
                divContainer: dialogContainer,
                webview: webview,
                readerView,
                fromPanel: fromPanel,
                tabId: tabId,
                progressBar,
                lifetime
            });
            lifetime.add(() => progressBar.destroy());
            lifetime.add(() => this.removeAssociatedTab(webviewId));

            // remove dialogs when tab is closed without closing dialogs
            if (!fromPanel) {
                const clearWebviews = closedTabId => {
                    if (tabId === closedTabId) {
                        this.webviews.forEach((view, key) => view.tabCloseListener === clearWebviews && this.removeDialog(key));
                    }
                };
                this.webviews.get(webviewId).tabCloseListener = clearWebviews;
                chrome.tabs.onRemoved.addListener(clearWebviews);
                lifetime.add(() => chrome.tabs.onRemoved.removeListener(clearWebviews));
            }

            //#region dialogTab properties
            dialogTab.setAttribute('class', 'dialog-tab');
            dialogTab.style.width = 85 - 5 * this.webviews.size + '%';
            dialogTab.style.height = 95 - 5 * this.webviews.size + '%';
            // keep hidden until anchored start is ready
            dialogTab.style.visibility = 'hidden';
            //#endregion

            //#region optionsContainer properties
            optionsContainer.setAttribute('class', 'options-container');

            const titleElement = document.createElement('span');
            titleElement.setAttribute('class', 'options-title');

            let pageTitle = UrlUtils.toDisplayText(linkUrl),
                showingOptions = false,
                hideOptionsTimeout,
                fadeTimeout;

            const renderTitle = () => {
                    titleElement.textContent = pageTitle;
                    titleElement.title = pageTitle;
                    optionsContainer.replaceChildren(titleElement);
                },
                setTitleText = title => {
                    pageTitle = UrlUtils.toDisplayText(title || webview.src || linkUrl);
                    if (!showingOptions) renderTitle();
                },
                showOptions = () => {
                    clearTimeout(hideOptionsTimeout);
                    clearTimeout(fadeTimeout);

                    if (showingOptions) return;

                    optionsContainer.classList.add('fade-out');
                    fadeTimeout = setTimeout(() => {
                        if (lifetime.signal.aborted) return;
                        optionsContainer.replaceChildren();
                        this.showWebviewOptions(webviewId, optionsContainer);
                        optionsContainer.classList.add('showing-options');
                        optionsContainer.classList.remove('fade-out');
                        showingOptions = true;
                    }, this.ANIMATION_DURATIONS.OPTIONS_FADE);
                },
                showTitle = () => {
                    clearTimeout(hideOptionsTimeout);
                    clearTimeout(fadeTimeout);

                    if (!showingOptions) {
                        renderTitle();
                        optionsContainer.classList.remove('showing-options');
                        optionsContainer.classList.remove('fade-out');
                        return;
                    }

                    hideOptionsTimeout = setTimeout(() => {
                        if (!showingOptions) return;

                        optionsContainer.classList.add('fade-out');
                        fadeTimeout = setTimeout(() => {
                            if (lifetime.signal.aborted) return;
                            renderTitle();
                            optionsContainer.classList.remove('showing-options');
                            optionsContainer.classList.remove('fade-out');
                            showingOptions = false;
                        }, this.ANIMATION_DURATIONS.OPTIONS_FADE);
                    }, this.ANIMATION_DURATIONS.OPTIONS_HIDE);
                };

            renderTitle();

            lifetime.add(() => {
                clearTimeout(hideOptionsTimeout);
                clearTimeout(fadeTimeout);
            });

            optionsContainer.addEventListener('mouseenter', showOptions, {signal: lifetime.signal});
            optionsContainer.addEventListener('mouseleave', showTitle, {signal: lifetime.signal});
            //#endregion

            //#region webview properties
            webview.id = webviewId;
            webview.className = 'dialog-page-webview';

            let titleFetchTimeout;
            lifetime.add(() => clearTimeout(titleFetchTimeout));

            webview.addEventListener(
                'loadstart',
                () => {
                    webview.style.backgroundColor = 'var(--colorBorder)';
                    progressBar.start();
                    setTitleText(webview.src || linkUrl);

                    const input = document.getElementById(`input-${webview.id}`);
                    if (input !== null) {
                        input.value = webview.src;
                    }
                },
                {signal: lifetime.signal}
            );
            webview.addEventListener(
                'loadcommit',
                () => {
                    setTitleText(webview.src || linkUrl);
                },
                {signal: lifetime.signal}
            );
            webview.addEventListener(
                'loadstop',
                () => {
                    progressBar.clear(true);

                    const expectedSrc = webview.src;
                    clearTimeout(titleFetchTimeout);
                    titleFetchTimeout = setTimeout(() => {
                        if (lifetime.signal.aborted) return;
                        this.fetchWebviewTitle(webview, expectedSrc, setTitleText);
                    }, TIMING_CONFIG.titleFetchDelay);

                    this.webviews.get(webview.id)?.readerView.refresh();
                },
                {signal: lifetime.signal}
            );
            fromPanel && webview.addEventListener('mousedown', event => event.stopPropagation(), {signal: lifetime.signal});
            //#endregion

            //#region dialogContainer properties
            dialogContainer.setAttribute('class', 'dialog-container');

            const pointerX = origin?.x ?? window.innerWidth / 2;
            const pointerY = origin?.y ?? window.innerHeight / 2;
            dialogContainer.dataset.pointerX = String(pointerX);
            dialogContainer.dataset.pointerY = String(pointerY);

            const stopEvent = event => {
                event.preventDefault();
                event.stopPropagation();

                if (event.target.id === `input-${webviewId}`) {
                    const inputElement = event.target;

                    // Calculate the cursor position based on the click location
                    const offsetX = event.clientX - inputElement.getBoundingClientRect().left;

                    // Use cached canvas context for text measurement (performance)
                    this.#canvasContext.font = window.getComputedStyle(inputElement).font;

                    // Measure the width of the text up to each character
                    let cursorPosition = 0,
                        textWidth = 0;
                    for (let i = 0; i < inputElement.value.length; i++) {
                        const charWidth = this.#canvasContext.measureText(inputElement.value[i]).width;
                        if (textWidth + charWidth > offsetX) {
                            cursorPosition = i;
                            break;
                        }
                        textWidth += charWidth;
                        cursorPosition = i + 1;
                    }

                    // Manually focus the input element and set the cursor position
                    inputElement.focus({preventScroll: true});
                    inputElement.setSelectionRange(cursorPosition, cursorPosition);
                }
            };

            if (fromPanel) {
                document.body.addEventListener('pointerdown', stopEvent, {signal: lifetime.signal});
            }

            dialogContainer.addEventListener(
                'click',
                event => {
                    if (event.target === dialogContainer) {
                        this.removeDialog(webviewId);
                    }
                },
                {signal: lifetime.signal}
            );

            //#endregion

            dialogTab.appendChild(optionsContainer);
            dialogTab.appendChild(progressBar.element);
            dialogTab.append(...readerView.elements);
            dialogTab.appendChild(webview);

            dialogContainer.appendChild(dialogTab);

            this.prepareDialogWebview(webview, webviewId, linkUrl, lifetime).then(success => {
                if (lifetime.signal.aborted || !success) {
                    this.cleanupDialog(webviewId);
                    this.webviews.delete(webviewId);
                    return;
                }

                (fromPanel ? document.querySelector('#browser') : document.querySelector('.active.visible.webpageview')).appendChild(dialogContainer);

                requestAnimationFrame(() => {
                    if (lifetime.signal.aborted) return;
                    this.setAnchoredTransformVars(dialogTab, pointerX, pointerY);
                    dialogTab.style.visibility = 'visible';
                    dialogContainer.classList.add('is-open');
                    dialogTab.classList.add('animating-open');

                    const onOpenEnd = e => {
                        if (e.animationName === 'dialog-tab-open-anchored') {
                            dialogTab.classList.remove('animating-open');
                        }
                    };
                    dialogTab.addEventListener('animationend', onOpenEnd, {signal: lifetime.signal});
                });
            });
        }

        prepareDialogWebview(webview, webviewId, linkUrl, lifetime) {
            return this.createRelatedTab(webviewId, linkUrl, lifetime).then(tab => {
                if (!tab?.id) return false;

                const tabId = String(tab.id);
                this.webviews.get(webviewId).relatedTabId = tab.id;
                webview.tab_id = tabId;
                webview.setAttribute('tab_id', tabId);
                webview.setAttribute('parent_tab_id', '0');
                webview.setAttribute('name', 'vivaldi-dialog');
                return true;
            });
        }

        createRelatedTab(webviewId, linkUrl, lifetime) {
            const panelId = `${webviewId}tabId`;
            return new Promise(resolve => {
                // Vivaldi web panels use this related-tab pattern. It keeps the
                // page out of the tab bar while still giving extensions a real tab.
                chrome.tabs.create(
                    {
                        url: linkUrl,
                        active: false,
                        windowId: vivaldiWindowId,
                        vivExtData: JSON.stringify({panelId})
                    },
                    tab => {
                        if (chrome.runtime.lastError || !tab?.id) {
                            console.debug('Dialog mod: Failed to create related tab:', chrome.runtime.lastError);
                            resolve(null);
                            return;
                        }

                        if (lifetime.signal.aborted) {
                            chrome.tabs.remove(tab.id);
                            resolve(null);
                            return;
                        }

                        resolve(tab);
                    }
                );
            });
        }

        /**
         * Compute anchored translate for the current layout so that the dialog
         * grows exactly from (viewportX, viewportY) when scaling from s0 → 1.
         * We precompute the starting translation T0 = (1 - s0) * (P - L).
         */
        setAnchoredTransformVars(dialogTab, viewportX, viewportY, s0 = 0.1) {
            const rect = dialogTab.getBoundingClientRect();
            const dx = viewportX - rect.left;
            const dy = viewportY - rect.top;
            const t0x = (1 - s0) * dx;
            const t0y = (1 - s0) * dy;

            dialogTab.style.setProperty('--s0', String(s0));
            dialogTab.style.setProperty('--tx0', `${t0x}px`);
            dialogTab.style.setProperty('--ty0', `${t0y}px`);

            return {t0x, t0y, s0};
        }

        fetchWebviewTitle(webview, expectedSrc, setTitleText) {
            try {
                let title = '';
                if (webview.getTitle) {
                    title = webview.getTitle();
                }

                if (title) {
                    if (webview.src === expectedSrc) setTitleText(title);
                    return;
                }

                webview.executeScript({code: 'document.title'}, results => {
                    if (chrome.runtime.lastError || webview.src !== expectedSrc) return;

                    const resolvedTitle = results?.[0];
                    if (resolvedTitle) setTitleText(resolvedTitle);
                });
            } catch (error) {
                console.debug('Dialog mod: Failed to fetch page title:', error);
            }
        }

        /**
         * Displays open in tab buttons and current url in input element
         * @param {string} webviewId is the id of the webview
         * @param {Object} thisElement the current instance divOptionContainer (div) element
         */
        showWebviewOptions(webviewId, thisElement) {
            let inputId = `input-${webviewId}`,
                data = this.webviews.get(webviewId),
                webview = data ? data.webview : undefined,
                signal = data?.lifetime?.signal;
            if (webview) {
                let input = null;

                if (UI_CONFIG.showUrlInput) {
                    input = document.createElement('input');
                    input.value = webview.src;
                    input.id = inputId;
                    input.setAttribute('class', 'dialog-input');

                    input.addEventListener(
                        'keydown',
                        async event => {
                            if (event.key === 'Enter') {
                                const value = input.value;
                                await this.navigateWebview(webview, await UrlUtils.normalizeOrSearch(value, this.searchEngineUtils));
                            }
                        },
                        {signal}
                    );
                }

                const fragment = document.createDocumentFragment(),
                    buttons = [
                        {content: this.iconUtils.back, action: () => this.navigateWebviewHistory(webview, 'back'), tooltip: TOOLTIP_CONFIG.back},
                        {content: this.iconUtils.forward, action: () => this.navigateWebviewHistory(webview, 'forward'), tooltip: TOOLTIP_CONFIG.forward},
                        {content: this.iconUtils.reload, action: () => webview.reload(), tooltip: TOOLTIP_CONFIG.reload},
                        {
                            content: this.iconUtils.readerView,
                            action: this.showReaderView.bind(this, webview),
                            cls: 'reader-view-toggle',
                            tooltip: TOOLTIP_CONFIG.readerView
                        },
                        {
                            content: this.iconUtils.newTab,
                            action: () => (UI_CONFIG.showUrlInput ? this.openNewTab(inputId, true) : this.openNewTabFromWebview(webview, true)),
                            tooltip: TOOLTIP_CONFIG.newTab
                        },
                        {
                            content: this.iconUtils.backgroundTab,
                            action: () => (UI_CONFIG.showUrlInput ? this.openNewTab(inputId, false) : this.openNewTabFromWebview(webview, false)),
                            tooltip: TOOLTIP_CONFIG.backgroundTab
                        }
                    ];

                buttons.forEach(button =>
                    fragment.appendChild(this.createOptionsButton(button.content, button.action, button.cls || '', button.tooltip, signal))
                );
                if (input) fragment.appendChild(input);

                thisElement.append(fragment);
            }
        }

        /**
         * Create a button with default style for the web view options.
         * @param {Node | string} content the content of the button to display
         * @param {Function} clickListenerCallback the click listeners callback function
         * @param {string} cls optional additional class for the button
         * @param {string} tooltip optional tooltip text
         * @param {AbortSignal} signal optional lifetime signal
         */
        createOptionsButton(content, clickListenerCallback, cls = '', tooltip = '', signal = undefined) {
            const button = document.createElement('button');
            button.setAttribute('class', `options-button ${cls}`.trim());
            if (tooltip) button.dataset.tooltip = tooltip;
            button.addEventListener('click', clickListenerCallback, {signal});

            if (typeof content === 'string') {
                button.innerHTML = content;
            } else {
                button.appendChild(content);
            }

            return button;
        }

        /**
         * Returns a unique, collision-resistant id.
         * Uses timestamp + random alphanumeric string for uniqueness.
         */
        getWebviewId() {
            const timestamp = Date.now();
            const randomPart = Math.random().toString(36).substring(2, 11);
            return `${timestamp}-${randomPart}`;
        }

        /**
         * Sets the webviews content to a reader version
         *
         * @param {webview} webview the webview to update
         */
        async showReaderView(webview) {
            const data = this.webviews.get(webview.id);
            if (!data) return;

            await data.readerView.toggle();
        }

        async leaveReaderMode(webview) {
            const data = this.webviews.get(webview.id);
            if (!data?.readerView.isOpen) return;

            data.readerView.hide();
        }

        async navigateWebview(webview, url) {
            await this.leaveReaderMode(webview);
            webview.src = url;
        }

        async navigateWebviewHistory(webview, direction) {
            await this.leaveReaderMode(webview);

            if (direction === 'back') {
                webview.back();
            } else if (direction === 'forward') {
                webview.forward();
            }
        }

        /**
         * Opens a new Chrome tab with specified active boolean value
         * @param {string} inputId is the id of the input containing current url
         * @param {boolean} active indicates whether the tab is active or not (background tab)
         */
        async openNewTab(inputId, active) {
            const url = document.getElementById(inputId).value;
            chrome.tabs.create({url: await UrlUtils.normalizeOrSearch(url, this.searchEngineUtils), active: active});
        }

        openNewTabFromWebview(webview, active) {
            chrome.tabs.create({url: webview.src, active: active});
        }
    }

    class UrlUtils {
        static VALID_URL_PREFIXES = ['http://', 'https://', 'file://', 'vivaldi://', 'chrome://', 'chrome-extension://', 'data:', 'blob:'];
        static BLOCKED_SCHEMES = ['javascript:', 'vbscript:'];

        static isValid(url) {
            if (!url || typeof url !== 'string') return false;

            const trimmedUrl = url.trim().toLowerCase();
            if (this.BLOCKED_SCHEMES.some(scheme => trimmedUrl.startsWith(scheme))) return false;
            if (trimmedUrl.startsWith('about:')) return true;

            return this.VALID_URL_PREFIXES.some(prefix => trimmedUrl.startsWith(prefix));
        }

        static async normalizeOrSearch(input, searchEngineUtils) {
            if (this.isValid(input)) return input.trim();

            const searchRequest = await vivaldi.searchEngines.getSearchRequest(searchEngineUtils.defaultSearchId, input);
            return searchRequest.url;
        }

        static toDisplayText(value) {
            if (!value || typeof value !== 'string') return '';

            try {
                const url = new URL(value);
                if (!['http:', 'https:'].includes(url.protocol)) return value;

                return url.origin;
            } catch (error) {
                return value;
            }
        }
    }

    class WebviewLinkInteractionUtils {
        watchedWebviews = new WeakSet();
        targetUrls = new WeakMap();
        activeMiddleHold = null;

        constructor(getWebviewFromPanel, openDialog, timingConfig) {
            this.getWebviewFromPanel = getWebviewFromPanel;
            this.openDialog = openDialog;
            this.timingConfig = timingConfig;

            this.prepareOpenWebviews();
            this.observeWebviews();
        }

        prepareOpenWebviews() {
            document.querySelectorAll('webview[tab_id]').forEach(webview => this.prepareWebview(webview));
        }

        observeWebviews() {
            const root = document.getElementById('browser') || document.body;
            if (!root) return;

            const prepareNode = node => {
                if (!(node instanceof Element)) return;

                if (node.matches('webview[tab_id]')) {
                    this.prepareWebview(node);
                }

                node.querySelectorAll?.('webview[tab_id]').forEach(webview => this.prepareWebview(webview));
            };

            new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes') {
                        prepareNode(mutation.target);
                        return;
                    }

                    mutation.addedNodes.forEach(prepareNode);
                });
            }).observe(root, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['tab_id']
            });
        }

        prepareWebview(webview) {
            if (this.watchedWebviews.has(webview)) return;

            this.watchedWebviews.add(webview);
            // targeturlchanged reports the link URL Vivaldi would show in the status bar,
            // so middle-click handling does not need code injected into every website.
            webview.addEventListener('targeturlchanged', event => this.#handleTargetUrlChanged(webview, event));
            webview.addEventListener('mousedown', event => this.#handleMouseDown(webview, event), true);
            webview.addEventListener('mouseup', event => this.#handleMouseUp(webview, event), true);
            webview.addEventListener('mouseleave', () => this.#cancelMiddleHold(webview), true);
            webview.addEventListener('dragstart', () => this.#cancelMiddleHold(webview), true);
        }

        #handleTargetUrlChanged(webview, event) {
            const url = event.newUrl || '';

            if (UrlUtils.isValid(url)) {
                this.targetUrls.set(webview, url);
            } else {
                this.targetUrls.delete(webview);
            }
        }

        #handleMouseDown(webview, event) {
            const url = this.targetUrls.get(webview);
            if (!url) return;

            const origin = {x: event.clientX, y: event.clientY};

            if (event.ctrlKey && event.altKey && [0, 1].includes(event.button)) {
                this.#cancelNativeClick(event);
                this.#openDialogFromWebview(webview, url, origin);
                return;
            }

            if (event.button !== 1) return;

            this.#cancelNativeClick(event);
            this.#cancelMiddleHold();

            const holdState = {
                webview,
                timer: setTimeout(() => {
                    holdState.opened = true;
                    this.#openDialogFromWebview(webview, url, origin);
                }, this.timingConfig.middleClickDelay),
                opened: false
            };

            this.activeMiddleHold = holdState;
        }

        #handleMouseUp(webview, event) {
            if (event.button !== 1) return;

            const holdState = this.activeMiddleHold;
            if (!holdState || holdState.webview !== webview) return;

            if (holdState.opened) this.#cancelNativeClick(event);
            this.#cancelMiddleHold(webview);
        }

        #cancelMiddleHold(webview = undefined) {
            const holdState = this.activeMiddleHold;
            if (!holdState || (webview && holdState.webview !== webview)) return;

            clearTimeout(holdState.timer);
            this.activeMiddleHold = null;
        }

        #openDialogFromWebview(webview, url, origin) {
            this.openDialog(url, this.getWebviewFromPanel(webview), origin);
        }

        #cancelNativeClick(event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation?.();
        }
    }

    class WebsiteInjectionUtils {
        constructor(getWebviewConfig, openDialog, iconConfig, timingConfig) {
            this.linkInteractionConfig = JSON.stringify({
                icon: iconConfig,
                timing: timingConfig
            });

            // inject detection of click observers
            chrome.webNavigation.onCompleted.addListener(navigationDetails => {
                const {webview, fromPanel} = getWebviewConfig(navigationDetails);
                webview && this.injectCode(webview, fromPanel);
            });

            // react on demand to open a dialog
            chrome.runtime.onMessage.addListener(message => {
                if (message.url) {
                    openDialog(message.url, message.fromPanel, message.origin);
                }
            });
        }

        injectCode(webview, fromPanel) {
            const handler = WebsiteLinkInteractionHandler.toString(),
                instantiationCode = `
                if (!this.dialogEventListenerSet) {
                    new (${handler})(${fromPanel}, ${this.linkInteractionConfig});
                    this.dialogEventListenerSet = true;
                }
            `;

            try {
                webview.executeScript({code: instantiationCode}, result => {
                    if (chrome.runtime.lastError) {
                        // Script injection failed (e.g., on chrome:// pages or blocked by CSP)
                        console.debug('Dialog mod: Script injection failed:', chrome.runtime.lastError.message);
                    }
                });
            } catch (error) {
                console.debug('Dialog mod: Failed to execute script:', error);
            }
        }
    }

    class WebsiteLinkInteractionHandler {
        constructor(fromPanel, config) {
            this.fromPanel = fromPanel;
            this.config = config;
            this.iconConfig = config.icon;
            this.timingConfig = config.timing;
            this.icon = null;
            this.boundHideIcon = this.#hideLinkIcon.bind(this);
            this.timers = {showIcon: null, showDialog: null, hideIcon: null};

            this.#initialize();
        }

        #initialize() {
            if (this.iconConfig.linkIcon) {
                this.#setupIconHandling();
            }
        }

        #setupIconHandling() {
            this.#createIcon();
            this.#createIconStyle();

            document.addEventListener('mouseover', event => {
                const link = this.#getLinkElement(event);
                if (!link) return;

                clearTimeout(this.timers.showIcon);
                clearTimeout(this.timers.hideIcon);

                this.timers.showIcon = setTimeout(() => {
                    if (!link.isConnected) return;

                    requestAnimationFrame(() => {
                        const rect = link.getBoundingClientRect();
                        Object.assign(this.icon.style, {
                            display: 'block',
                            left: `${rect.right + 5}px`,
                            top: `${rect.top + window.scrollY}px`
                        });
                    });

                    this.icon.dataset.targetUrl = link.href;
                    this.currentLinkEl = link;

                    link.addEventListener('mouseleave', this.boundHideIcon);
                }, this.iconConfig.showIconDelay);
            });
        }

        #createIcon() {
            const icon = document.createElement('div');
            icon.className = `link-icon ${this.iconConfig.linkIcon}`;
            icon.style.display = 'none';

            const getLinkCenter = () => {
                const el = this.currentLinkEl;
                if (el) {
                    const r = el.getBoundingClientRect();
                    return {x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2)};
                }
                return {x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2)};
            };

            if (this.iconConfig.linkIconInteractionOnHover) {
                icon.addEventListener('mouseenter', () => {
                    clearTimeout(this.timers.hideIcon);
                    this.timers.showDialog = setTimeout(() => {
                        const {x, y} = getLinkCenter();
                        this.#sendDialogMessage(this.icon.dataset.targetUrl, x, y);
                    }, this.iconConfig.showDialogOnHoverDelay);
                });
                icon.addEventListener('mouseleave', () => {
                    clearTimeout(this.timers.showDialog);
                    this.#hideLinkIcon();
                });
            } else {
                icon.addEventListener('click', () => {
                    const {x, y} = getLinkCenter();
                    this.#sendDialogMessage(this.icon.dataset.targetUrl, x, y);
                });
                icon.addEventListener('mouseenter', () => clearTimeout(this.timers.hideIcon));
                icon.addEventListener('mouseleave', this.boundHideIcon);
            }

            this.icon = icon;
            document.body.appendChild(this.icon);
        }

        #hideLinkIcon() {
            clearTimeout(this.timers.showIcon);
            this.timers.hideIcon = setTimeout(
                () => {
                    this.icon.style.display = 'none';
                },
                this.iconConfig.linkIconInteractionOnHover ? 300 : 600
            );
        }

        #getLinkElement(event) {
            const getAnchor = node => {
                if (node instanceof HTMLAnchorElement && node.getAttribute('href') !== '#') return node;
                if (node instanceof Element) return node.closest('a[href]:not([href="#"])');
            };

            const pathLink = (event.composedPath?.() || []).map(getAnchor).find(Boolean);
            return pathLink || getAnchor(event.target);
        }

        #sendDialogMessage(url, x, y) {
            chrome.runtime.sendMessage({url, fromPanel: this.fromPanel, origin: {x, y}});
        }

        #createIconStyle() {
            const style = document.createElement('style');
            style.textContent = `
                .link-icon {
                    position: absolute;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    cursor: pointer;
                    z-index: 9999;
                    transition: opacity 0.2s ease;
                }

                .link-icon:hover {
                    opacity: 0.9;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Utility class for adding and updating context menu items
     */
    class SearchEngineUtils {
        /**
         * Constructor for SearchEngineUtils
         * @param {Function} openLinkCallback - Callback for opening links
         * @param {Function} searchCallback - Callback for searching
         * @param {Object} [config={}] - Configuration options
         * @param {string} [config.menuPrefix] - Prefix for the context menu item
         * @param {string} [config.linkMenuTitle] - Titel for the link menu
         * @param {string} [config.searchMenuTitle] - title for the search menu
         * @param {string} [config.selectSearchMenuTitle] - title for the select search menu
         */
        constructor(openLinkCallback, searchCallback, config = {}) {
            this.openLinkCallback = openLinkCallback;
            this.searchCallback = searchCallback;

            this.menuPrefix = config.menuPrefix;
            this.linkMenuTitle = config.linkMenuTitle;
            this.searchMenuTitle = config.searchMenuTitle;
            this.selectSearchMenuTitle = config.selectSearchMenuTitle;

            this.createdContextMenuMap = new Map();
            this.searchEngineCollection = [];
            this.defaultSearchId = null;
            this.privateSearchId = null;

            // Cache static IDs for frequent access
            this.LINK_ID = 'dialog-tab-link';
            this.SEARCH_ID = 'search-dialog-tab';
            this.SELECT_SEARCH_ID = 'select-search-dialog-tab';

            this.#initialize();
        }

        /**
         * Initializes the context menu and listeners
         * @returns {Promise<void>}
         */
        async #initialize() {
            // Create context menu items
            this.#createContextMenuOption();

            // Initialize search engines and context menus
            this.#updateSearchEnginesAndContextMenu();

            // Update context menus when search engines change
            vivaldi.searchEngines.onTemplateUrlsChanged.addListener(() => {
                this.#removeContextMenuSelectSearch();
                this.#updateSearchEnginesAndContextMenu();
            });
        }

        /**
         * Creates context menu items to open a dialog tab
         */
        #createContextMenuOption() {
            chrome.contextMenus.create({
                id: this.LINK_ID,
                title: this.#formatMenuTitle(this.linkMenuTitle),
                contexts: ['link']
            });
            chrome.contextMenus.create({
                id: this.SEARCH_ID,
                title: this.#formatMenuTitle(this.searchMenuTitle),
                contexts: ['selection']
            });
            chrome.contextMenus.create({
                id: this.SELECT_SEARCH_ID,
                title: this.#formatMenuTitle(this.selectSearchMenuTitle),
                contexts: ['selection']
            });

            chrome.contextMenus.onClicked.addListener(itemInfo => {
                const {menuItemId, parentMenuItemId, linkUrl, selectionText} = itemInfo;

                if (menuItemId === this.LINK_ID) {
                    this.openLinkCallback(linkUrl);
                } else if (menuItemId === this.SEARCH_ID) {
                    const engineId = window.incognito ? this.privateSearchId : this.defaultSearchId;
                    this.searchCallback(engineId, selectionText);
                } else if (parentMenuItemId === this.SELECT_SEARCH_ID) {
                    const engineId = menuItemId.substr(parentMenuItemId.length);
                    this.searchCallback(engineId, selectionText);
                }
            });
        }

        #formatMenuTitle(title) {
            return this.menuPrefix ? `${this.menuPrefix} ${title}` : title;
        }

        /**
         * Updates the search engines and context menu
         */
        async #updateSearchEnginesAndContextMenu() {
            const searchEngines = await vivaldi.searchEngines.getTemplateUrls();
            this.searchEngineCollection = searchEngines.templateUrls;
            this.defaultSearchId = searchEngines.defaultSearch;
            this.privateSearchId = searchEngines.defaultPrivate;

            this.#createContextMenuSelectSearch();
        }

        /**
         * Removes sub-context menu items for select search engine menu item
         */
        #removeContextMenuSelectSearch() {
            this.createdContextMenuMap.forEach((_, engineId) => {
                const menuId = this.SELECT_SEARCH_ID + engineId;
                chrome.contextMenus.remove(menuId);
            });

            this.createdContextMenuMap.clear();
        }

        /**
         * Creates sub-context menu items for select search engine menu item
         */
        #createContextMenuSelectSearch() {
            this.searchEngineCollection.forEach(engine => {
                if (!this.createdContextMenuMap.has(engine.guid)) {
                    chrome.contextMenus.create({
                        id: this.SELECT_SEARCH_ID + engine.guid,
                        parentId: this.SELECT_SEARCH_ID,
                        title: engine.name,
                        contexts: ['selection']
                    });
                    this.createdContextMenuMap.set(engine.guid, true);
                }
            });
        }
    }

    class ReaderView {
        static STYLE_PREF = 'vivaldi.webpages.reader.style';
        static #SYSTEM_THEMES_PREF = 'vivaldi.themes.system';
        static #DEFAULTS = {
            fontFamily: 'sans-serif',
            fontSize: 1.3,
            lineHeight: 1.5,
            width: 64,
            themeStyle: 'light',
            writingMode: 'unset'
        };
        static #COLOR_DEFAULTS = {
            '--colorBg': '#f6f6f6',
            '--colorFg': '#222222',
            '--colorHighlightBg': '#4c70f0'
        };
        static #openViews = new Set();
        static #extractContentInPage = function () {
            const preservedClasses = ['caption', 'emoji', 'hidden', 'invisible', 'sr-only', 'visually-hidden', 'visuallyhidden', 'wp-caption', 'wp-caption-text', 'wp-smiley'];
            const escapeHtml = value => {
                const node = document.createElement('div');
                node.textContent = value || '';
                return node.innerHTML;
            };

            if (!window.Readability || !window.DOMPurify || !window.isReaderable) {
                return {ready: false};
            }

            if (!window.isReaderable(document)) {
                return {ready: true, content: ''};
            }

            const reader = new window.Readability(document.cloneNode(true), {
                classesToPreserve: preservedClasses,
                charThreshold: 300,
                debug: false
            }).parse();

            if (!reader) return {ready: true, content: ''};

            const cleanContent = window.DOMPurify.sanitize(reader.content);
            const words = String(reader.textContent || '').split(/\s+/).filter(Boolean);
            const readMinutes = Math.max(1, Math.round(words.length / 225));
            const readTime = readMinutes === 1 ? 'Lesedauer: 1 Minute' : 'Lesedauer: ' + readMinutes + ' Minuten';
            const byline = reader.byline ? escapeHtml(reader.byline) + ' &mdash; ' : '';
            const direction = reader.dir || 'auto';

            return {
                ready: true,
                title: reader.title || document.title || '',
                content: '<h1>' + escapeHtml(reader.title) + '</h1>' +
                    '<p class="byline">' + byline + readTime + '</p>' +
                    '<hr />' +
                    '<article class="entry-content" dir="' + escapeHtml(direction) + '">' + cleanContent + '</article>'
            };
        };

        static get #EXTRACT_CONTENT_SCRIPT() {
            return `(${ReaderView.#extractContentInPage.toString()})();`;
        }

        static #prepareScrollInPage = function () {
            let style = document.getElementById('dialog-reader-scroll-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'dialog-reader-scroll-style';
                document.head.appendChild(style);
            }

            style.textContent = 'html, body { overflow: auto !important; } body { min-height: 100%; }';
        };

        static get #PREPARE_SCROLL_SCRIPT() {
            return `(${ReaderView.#prepareScrollInPage.toString()})();`;
        }

        constructor({sourceWebview, signal, settingsIcon, onNavigate}) {
            this.sourceWebview = sourceWebview;
            this.signal = signal;
            this.onNavigate = onNavigate;
            this.content = '';
            this.isOpen = false;
            this.toolbar = new ReaderToolbar({
                signal,
                settingsIcon,
                onPatch: patch => this.updateStyle(patch),
                onAdjust: (key, step, min, max) => this.adjustStyle(key, step, min, max)
            });
            this.webview = this.#createWebview();

            signal.addEventListener('abort', () => ReaderView.#openViews.delete(this), {once: true});
        }

        get elements() {
            return [this.toolbar.element, this.toolbar.toggle, this.webview];
        }

        async toggle() {
            if (this.isOpen) {
                this.hide();
                return false;
            }

            return this.show();
        }

        async show() {
            this.isOpen = true;
            this.sourceWebview.parentElement?.classList.add('reader-open');

            const result = await this.#extractReadableContent();
            if (!result || !this.isOpen) {
                this.hide();
                return false;
            }

            ReaderView.#openViews.add(this);
            this.content = result.content;
            this.#sendContent();
            return true;
        }

        hide() {
            this.isOpen = false;
            this.content = '';
            ReaderView.#openViews.delete(this);
            this.toolbar.setVisible(false);
            this.sourceWebview.parentElement?.classList.remove('reader-open');
        }

        refresh() {
            if (this.isOpen) this.show();
        }

        static syncOpenViews() {
            ReaderView.#openViews.forEach(view => view.syncStyle());
        }

        adjustStyle(key, step, min, max) {
            this.updateStyle(style => ({
                [key]: ReaderView.#clamp((style[key] ?? ReaderView.#DEFAULTS[key]) + step, min, max)
            }));
        }

        async updateStyle(patchOrFactory) {
            const current = await ReaderView.#getStylePref(),
                patch = typeof patchOrFactory === 'function' ? patchOrFactory(current) : patchOrFactory,
                value = {...current, ...patch};

            await vivaldi.prefs?.set?.({path: ReaderView.STYLE_PREF, value});
            ReaderView.syncOpenViews();
        }

        async syncStyle() {
            if (!this.isOpen) return;

            const style = await ReaderView.getStyle();
            this.toolbar.sync(style);
            this.#sendMessage({type: 'SET_STYLE', style});
        }

        #createWebview() {
            const readerWebview = document.createElement('webview');
            readerWebview.className = 'dialog-reader-webview';
            readerWebview.setAttribute('name', 'vivaldi-readerview');
            readerWebview.setAttribute('allowtransparency', 'on');
            readerWebview.src = `${location.origin}/components/reader/reader.html`;

            readerWebview.addEventListener(
                'loadstop',
                () => {
                    this.#prepareScroll();
                    this.#sendContent();
                },
                {signal: this.signal}
            );

            readerWebview.addEventListener(
                'wheel',
                event => {
                    event.preventDefault();
                    this.#scroll(event.deltaX, event.deltaY);
                },
                {signal: this.signal, passive: false}
            );

            readerWebview.addEventListener(
                'consolemessage',
                event => {
                    const linkMatch = event.message?.match(/^LINK_CLICKED\s+(.+)$/);
                    if (linkMatch) this.onNavigate(linkMatch[1]);
                },
                {signal: this.signal}
            );

            return readerWebview;
        }

        #prepareScroll() {
            try {
                this.webview.executeScript({code: ReaderView.#PREPARE_SCROLL_SCRIPT});
            } catch (error) {
                console.debug('Dialog mod: Failed to prepare reader scrolling:', error);
            }
        }

        #scroll(deltaX, deltaY) {
            const x = Number.isFinite(deltaX) ? deltaX : 0,
                y = Number.isFinite(deltaY) ? deltaY : 0;

            try {
                this.webview.executeScript({code: `window.scrollBy(${JSON.stringify(x)}, ${JSON.stringify(y)});`});
            } catch (error) {
                console.debug('Dialog mod: Failed to scroll reader:', error);
            }
        }

        #sendMessage(message) {
            this.webview.contentWindow?.postMessage?.(message, '*');
        }

        #sendContent() {
            if (!this.isOpen || !this.content) return;

            this.#sendMessage({type: 'SET_CONTENT', content: this.content});
            this.syncStyle();
        }

        #extractReadableContent(attempts = 6) {
            if (!this.isOpen) return Promise.resolve(null);

            return new Promise(resolve => {
                this.sourceWebview.executeScript({code: ReaderView.#EXTRACT_CONTENT_SCRIPT}, results => {
                    if (chrome.runtime.lastError) {
                        console.debug('Dialog mod: Failed to extract reader content:', chrome.runtime.lastError);
                        resolve(null);
                        return;
                    }

                    const result = results?.[0];
                    if (result?.ready) {
                        resolve(result.content ? result : null);
                        return;
                    }

                    if (attempts <= 0) {
                        resolve(null);
                        return;
                    }

                    const retryTimeout = setTimeout(() => {
                        this.#extractReadableContent(attempts - 1).then(resolve);
                    }, 250);
                    this.signal.addEventListener('abort', () => clearTimeout(retryTimeout), {once: true});
                });
            });
        }

        static #clamp(value, min, max) {
            return Math.min(max, Math.max(min, Math.round(value * 10) / 10));
        }

        static async #getVivaldiPref(path) {
            try {
                return await vivaldi.prefs?.get?.(path);
            } catch {
                return undefined;
            }
        }

        static #getCurrentThemeColors() {
            const hosts = [document.querySelector('#browser'), document.querySelector('.active.visible.webpageview'), document.body, document.documentElement].filter(Boolean),
                color = name => hosts.map(host => getComputedStyle(host).getPropertyValue(name).trim()).find(Boolean) || ReaderView.#COLOR_DEFAULTS[name];

            return {
                '--colorBg': color('--colorBg'),
                '--colorFg': color('--colorFg'),
                '--colorHighlightBg': color('--colorHighlightBg')
            };
        }

        static async #getThemeColors(themeStyle) {
            const themeId = {light: 'Vivaldi1', dark: 'Vivaldi2'}[themeStyle];
            if (!themeId) return ReaderView.#getCurrentThemeColors();

            const systemThemes = await ReaderView.#getVivaldiPref(ReaderView.#SYSTEM_THEMES_PREF),
                theme = Array.isArray(systemThemes) ? systemThemes.find(({id}) => id === themeId) : null;

            return theme
                ? {
                      '--colorBg': theme.colorBg || ReaderView.#COLOR_DEFAULTS['--colorBg'],
                      '--colorFg': theme.colorFg || ReaderView.#COLOR_DEFAULTS['--colorFg'],
                      '--colorHighlightBg': theme.colorHighlightBg || ReaderView.#COLOR_DEFAULTS['--colorHighlightBg']
                  }
                : ReaderView.#getCurrentThemeColors();
        }

        static async #getStylePref() {
            return {...ReaderView.#DEFAULTS, ...((await ReaderView.#getVivaldiPref(ReaderView.STYLE_PREF)) || {})};
        }

        static async getStyle() {
            const style = await ReaderView.#getStylePref(),
                colors = await ReaderView.#getThemeColors(style.themeStyle);

            return {...colors, ...style};
        }
    }

    class ReaderToolbar {
        static ICONS = {
            sans: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M7.26579 2H8.50199L14 14H12.2038L10.5646 10.4651H5.33978L3.8099 14H2L7.26579 2ZM9.84747 8.94352L7.86682 4.61794L6.0296 8.94352H9.84747Z"/></svg>',
            serif:
                '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M9.57087 9.63143H5.15509L4.85492 10.3844C4.408 11.4698 4.18788 12.182 4.18788 12.5144C4.18788 12.8672 4.30795 13.1385 4.54141 13.3217C4.78155 13.5048 5.08171 13.5998 5.45525 13.5998V14H2V13.5998C2.51362 13.5184 2.9005 13.3352 3.1473 13.0435C3.39411 12.7518 3.70094 12.1481 4.05447 11.2256C4.08116 11.1374 4.22123 10.7982 4.46804 10.2148L7.84992 2H8.18344L12.0656 11.3951L12.5992 12.6365C12.7193 12.9146 12.8794 13.1317 13.0862 13.2945C13.2863 13.4573 13.5931 13.5591 14 13.5998V14H9.4308V13.5998C9.99111 13.5998 10.3713 13.5591 10.5648 13.4709C10.7649 13.3895 10.8583 13.2199 10.8583 12.9689C10.8583 12.84 10.7248 12.4601 10.4647 11.8293L9.57087 9.63143ZM9.42412 9.23799L7.36965 4.19785L5.32185 9.23799H9.42412Z"/></svg>',
            lineTight: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 14l2.5-3 2.5 3h-5zM10.5 1l-2.5 3-2.5-3h5zM2 5h12v1h-12zM2 7h12v1h-12zM2 9h12v1h-12z"/></svg>',
            lineLoose: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M5 3l2.5-3 2.5 3h-5zM10 12l-2.5 3-2.5-3h5zM2 4h11v1h-11zM2 7h11v1h-11zM2 10h11v1h-11z"/></svg>',
            widthNarrow: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M15 10l-3-2.5 3-2.5v5zM3 4h7v1h-7zM3 6h7v1h-7zM3 8h7v1h-7zM3 10h4v1h-4z"/></svg>',
            widthWide: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M13 5l3 2.5-3 2.5v-5zM0 4h11v1h-11zM0 6h11v1h-11zM0 8h11v1h-11zM0 10h7v1h-7z"/></svg>',
            theme:
                '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><circle fill="var(--kIconCircleFill)" stroke="var(--kIconCircleStroke)" stroke-width="1.1" stroke-opacity="0.8" cx="8" cy="8" r="4.5" /></svg>'
        };

        constructor({signal, settingsIcon, onPatch, onAdjust}) {
            this.signal = signal;
            this.onPatch = onPatch;
            this.onAdjust = onAdjust;
            this.element = this.#createToolbar();
            this.toggle = this.#createToggle(settingsIcon);
            this.visible = false;
        }

        #createToolbar() {
            const toolbar = document.createElement('div');
            toolbar.className = 'dialog-reader-toolbar toolbar toolbar-default reader-toolbar reader-toolbar-exit-active';
            toolbar.append(...this.#toolbarGroups().map(group => this.#createGroup(group.map(config => this.#createButton(config)))));
            return toolbar;
        }

        #toolbarGroups() {
            const icon = ReaderToolbar.ICONS;
            return [
                [
                    {className: 'font-family-sans', title: 'Sans-Serif', html: icon.sans, action: () => this.onPatch({fontFamily: 'sans-serif'})},
                    {className: 'font-family-serif', title: 'Serif', html: icon.serif, action: () => this.onPatch({fontFamily: 'serif'})}
                ],
                [
                    {className: 'decrease-font-size', title: 'Schriftgröße verkleinern', html: icon.sans, action: () => this.onAdjust('fontSize', -0.1, 0.8, 2.4)},
                    {className: 'increase-font-size', title: 'Schriftgröße vergrößern', html: icon.sans, action: () => this.onAdjust('fontSize', 0.1, 0.8, 2.4)}
                ],
                [
                    {className: 'decrease-line-height', title: 'Zeilenabstand verringern', html: icon.lineTight, action: () => this.onAdjust('lineHeight', -0.1, 1.1, 2.4)},
                    {className: 'increase-line-height', title: 'Zeilenabstand vergrößern', html: icon.lineLoose, action: () => this.onAdjust('lineHeight', 0.1, 1.1, 2.4)}
                ],
                [
                    {className: 'decrease-width', title: 'Spalten verschmälern', html: icon.widthNarrow, action: () => this.onAdjust('width', -4, 36, 96)},
                    {className: 'increase-width', title: 'Spalten verbreitern', html: icon.widthWide, action: () => this.onAdjust('width', 4, 36, 96)}
                ],
                [
                    {
                        className: 'theme-light',
                        title: 'Light',
                        html: icon.theme,
                        action: () => this.onPatch({themeStyle: 'light'}),
                        style: {'--kIconCircleFill': 'white', '--kIconCircleStroke': 'var(--colorFg)'}
                    },
                    {
                        className: 'theme-dark',
                        title: 'Dark',
                        html: icon.theme,
                        action: () => this.onPatch({themeStyle: 'dark'}),
                        style: {'--kIconCircleFill': 'black', '--kIconCircleStroke': 'var(--colorFg)'}
                    },
                    {
                        className: 'theme-theme',
                        title: 'Browser-Theme',
                        html: icon.theme,
                        action: () => this.onPatch({themeStyle: 'theme'}),
                        style: {'--kIconCircleFill': 'var(--colorBgLight)', '--kIconCircleStroke': 'var(--colorHighlightBg)'}
                    }
                ]
            ];
        }

        #createGroup(children) {
            const element = document.createElement('div');
            element.className = 'toolbar-group';
            element.append(...children);
            return element;
        }

        #createButton({className = '', title, html, action, style = {}}) {
            const wrapper = document.createElement('div'),
                button = document.createElement('button');

            wrapper.className = `button-toolbar ${className}`.trim();
            button.type = 'button';
            button.innerHTML = html;
            button.title = title;
            button.setAttribute('aria-label', title);
            button.addEventListener('click', action, {signal: this.signal});
            Object.entries(style).forEach(([name, value]) => button.style.setProperty(name, value));

            wrapper.appendChild(button);
            return wrapper;
        }

        #createToggle(settingsIcon) {
            const toggle = document.createElement('div'),
                button = this.#createButton({
                    title: 'Toolbar',
                    html: settingsIcon,
                    action: () => this.setVisible(!this.visible)
                }).firstElementChild;

            toggle.className = 'dialog-reader-settings-toggle reader-settings-toggle';
            toggle.appendChild(button);
            return toggle;
        }

        setVisible(visible) {
            this.visible = visible;
            this.element.parentElement?.classList.toggle('reader-toolbar-open', visible);
            this.element.classList.toggle('reader-toolbar-enter-active', visible);
            this.element.classList.toggle('reader-toolbar-exit-active', !visible);
            this.toggle.querySelector('button')?.setAttribute('aria-pressed', String(visible));
        }

        sync(style) {
            const fontFamily = style.fontFamily === 'serif' ? 'serif' : 'sans',
                themeStyle = style.themeStyle || 'light';

            this.#setPressed('.font-family-serif > button', fontFamily === 'serif');
            this.#setPressed('.font-family-sans > button', fontFamily !== 'serif');
            this.#setPressed('.theme-light > button', themeStyle === 'light');
            this.#setPressed('.theme-dark > button', themeStyle === 'dark');
            this.#setPressed('.theme-theme > button', themeStyle === 'theme');
        }

        #setPressed(selector, pressed) {
            this.element.querySelector(selector)?.classList.toggle('button-pressed', pressed);
        }
    }

    class ProgressBar {
        static CLEAR_DELAY = 250; // Delay before hiding progress bar after completion
        static EASING = 0.08;

        constructor(webviewId) {
            this.webviewId = webviewId;
            this.progress = 0;
            this.animationFrame = null;
            this.clearTimeout = null;
            this.element = this.#createProgressBar(webviewId);
        }

        #createProgressBar(webviewId) {
            const progressBar = document.createElement('div');
            progressBar.setAttribute('class', 'progress-bar');
            progressBar.id = `progressBar-${webviewId}`;
            return progressBar;
        }

        start() {
            this.element.style.visibility = 'visible';
            this.element.classList.remove('is-complete');
            this.progress = 0;
            this.element.style.width = '0%';

            this.#animateTo(85);
        }

        #animateTo(target) {
            cancelAnimationFrame(this.animationFrame);

            const step = () => {
                this.progress += (target - this.progress) * ProgressBar.EASING;
                this.element.style.width = `${this.progress.toFixed(2)}%`;

                if (this.progress < target - 0.5) {
                    this.animationFrame = requestAnimationFrame(step);
                }
            };

            this.animationFrame = requestAnimationFrame(step);
        }

        clear(loadStop = false) {
            cancelAnimationFrame(this.animationFrame);
            clearTimeout(this.clearTimeout);
            this.element.classList.add('is-complete');

            if (loadStop) {
                this.element.style.width = '100%';

                this.clearTimeout = setTimeout(() => {
                    this.progress = 0;
                    this.element.style.visibility = 'hidden';
                    this.element.style.width = '0%';
                }, ProgressBar.CLEAR_DELAY);
            }
        }

        destroy() {
            cancelAnimationFrame(this.animationFrame);
            clearTimeout(this.clearTimeout);
            this.animationFrame = null;
            this.clearTimeout = null;
        }
    }

    /**
     * Utility class to manage SVG icons
     * @class
     */
    class IconUtils {
        // Static icons
        static SVG = {
            settings:
                '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 28 28" height="28" width="28"><path stroke-width="1.5" stroke="currentColor" d="M19.25 14.5v.335l.25.224 1.622 1.452-1.334 2.187-1.685-.663-.38-.15-.332.238c-.41.294-.823.494-1.3.721l-.353.17-.063.385-.306 1.851h-2.635l-.416-1.89-.079-.357-.33-.159c-.477-.227-.89-.427-1.3-.721l-.332-.238-.38.15-1.685.663-1.321-2.167 1.498-1.147.295-.225v-2.318l-.295-.225-1.498-1.147 1.32-2.167 1.686.663.304.12.294-.14c.268-.129.528-.285.755-.42l.013-.008a8.21 8.21 0 0 1 .646-.362l.352-.168.064-.386.306-1.851h2.62l.306 1.851.064.386.352.168c.477.228.89.428 1.3.722l.332.238.38-.15 1.685-.663 1.324 2.17-1.458 1.15-.286.225V14.5z"></path><circle stroke="currentColor" r="1.5" cy="14" cx="14"></circle></svg>',
            readerView:
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M5.525 17.056h8.75c.29 0 .525.323.525.722 0 .365-.198.668-.454.715l-.071.007h-8.75c-.29 0-.525-.323-.525-.722 0-.366.198-.668.454-.716zh8.75Zm0-3.852h12.95c.29 0 .525.323.525.722 0 .366-.198.668-.454.716l-.071.006H5.525c-.29 0-.525-.323-.525-.722 0-.366.198-.668.454-.716zh12.95Zm0-3.852h12.95c.29 0 .525.323.525.722 0 .366-.198.668-.454.716l-.071.007H5.525c-.29 0-.525-.324-.525-.723 0-.366.198-.668.454-.716zh12.95Zm0-3.852h12.95c.29 0 .525.323.525.722 0 .366-.198.668-.454.716l-.071.006H5.525c-.29 0-.525-.323-.525-.722 0-.365.198-.668.454-.715zh12.95z"></path></svg>',
            newTab:
                '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h82.7L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3V192c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32H320zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32-14.3-32-32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"/></svg>',
            backgroundTab:
                '<svg xmlns="http://www.w3.org/2000/svg" height="1.1em" viewBox="0 0 448 512"><path d="M384 32c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96C0 60.7 28.7 32 64 32H384zM160 144c-13.3 0-24 10.7-24 24s10.7 24 24 24h94.1L119 327c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l135-135V328c0 13.3 10.7 24 24 24s24-10.7 24-24V168c-13.3 0-24-10.7-24-24H160z"/></svg>'
        };

        // Vivaldi icons
        static VIVALDI_BUTTONS = [
            {
                name: 'back',
                buttonName: 'Back',
                fallback:
                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.354 18 9 12l5.354-6 .646.725L10.297 12 15 17.271z"/></svg>'
            },
            {
                name: 'forward',
                buttonName: 'Forward',
                fallback:
                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M15 12 9.646 6 9 6.725 13.703 12 9 17.271l.646.729z"/></svg>'
            },
            {
                name: 'reload',
                buttonName: 'Reload',
                fallback:
                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12.2 6.367a5.833 5.833 0 1 0 5.77 4.971c-.052-.353.206-.694.563-.694.289 0 .542.2.586.485q.08.525.081 1.071a7 7 0 1 1-2.333-5.218v-.81a.583.583 0 1 1 1.166 0v2.334a.583.583 0 0 1-.583.583h-2.333a.583.583 0 0 1 0-1.167h1.049A5.8 5.8 0 0 0 12.2 6.367"/></svg>'
            },
            {
                name: 'settings',
                buttonName: 'Settings',
                fallback: IconUtils.SVG.settings
            }
        ];

        #initialized = false;
        #iconMap = new Map();

        constructor() {
            this.#initializeStaticIcons();
        }

        /**
         * Initializes static icons
         */
        #initializeStaticIcons() {
            Object.entries(IconUtils.SVG).forEach(([key, value]) => {
                this.#iconMap.set(key, value);
            });
        }

        /**
         * Initialize Vivaldi icons from the DOM or use fallback
         */
        #initializeVivaldiIcons() {
            if (this.#initialized) return;

            IconUtils.VIVALDI_BUTTONS.forEach(button => {
                this.#iconMap.set(button.name, this.#getVivaldiButton(button.buttonName, button.fallback));
            });

            this.#initialized = true;
        }

        /**
         * Gets the SVG of a Vivaldi button or returns the fallback
         * @param {string} buttonName - name of the button in Vivali ui
         * @param {string} fallbackSVG - fallback svg if no icon is found
         * @returns {string} - the SVG as a string
         */
        #getVivaldiButton(buttonName, fallbackSVG) {
            const svg = document.querySelector(`.button-toolbar [data-name="${buttonName}"] svg`);
            return svg ? svg.cloneNode(true).outerHTML : fallbackSVG;
        }

        /**
         * Get icon by name
         * @param {string} name - Name of the icon
         * @returns {string} - Icon as SVG string
         */
        getIcon(name) {
            if (!this.#initialized && IconUtils.VIVALDI_BUTTONS.some(btn => btn.name === name)) {
                this.#initializeVivaldiIcons();
            }

            return this.#iconMap.get(name) || '';
        }

        get ellipsis() {
            return this.getIcon('ellipsis');
        }

        get back() {
            return this.getIcon('back');
        }

        get forward() {
            return this.getIcon('forward');
        }

        get reload() {
            return this.getIcon('reload');
        }

        get readerView() {
            return this.getIcon('readerView');
        }

        get settings() {
            return this.getIcon('settings');
        }

        get newTab() {
            return this.getIcon('newTab');
        }

        get backgroundTab() {
            return this.getIcon('backgroundTab');
        }
    }
})();
