/*
* Vivaldi Preview (04/17/26)
* For Vivaldi browser version 7.8 and up
* Authors: biruktes, tam710562, oudstand, sudenim
* Forum link: https://forum.vivaldi.net/topic/92501/open-in-dialog-mod?_=1717490394230
*
* Description: Opens a preview window for links
*
* GNU General Public License v3.0
*/

(() => {
    const ICON_CONFIG = {
        linkIcon: '', // if set, an icon shows up after links - example values 'fa-solid fa-up-right-from-square', 'fa-solid fa-circle-info', 'fa-regular fa-square' search for other icons: https://fontawesome.com/search?o=r&ic=free&s=solid&ip=classic
        linkIconInteractionOnHover: false, // if false, you have to click the icon to show the dialog - if true, the dialog shows on mouseenter
        showIconDelay: 0, // set to 0 to disable - delays showing the icon on hovering a link
        showPreviewOnHoverDelay: 0 // set to 0 to disable - delays showing the dialog on hovering the linkIcon
    },
        CONTEXT_MENU_CONFIG = {
            linkMenuTitle: 'Open in Preview',
            searchMenuTitle: 'Search in Preview',
            selectSearchMenuTitle: 'Select Search in Preview'
        };

    // Wait for the browser to come to a ready state
    setTimeout(function waitPreview() {
        const browser = document.getElementById('browser');
        if (!browser) {
            return setTimeout(waitPreview, 300);
        }
        new PreviewWindow();
    }, 300);



    class PreviewWindow {
        rootBrowser = document.getElementById('browser');
        // Animation constants
        ANIMATION_DURATIONS = {
            CLOSE_TIMEOUT: 800, // Fallback timeout for close animation
            FADE_DELAY: 80, // Delay before starting fade animation
            PROGRESS_CLEAR: 250, // Progress bar clear timeout
            OPTIONS_HIDE: 800 // Options container hide delay
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
                    const tabId = this.selectors.getActiveWebview()?.tabId;
                    webviewData = webviewValues.findLast(_data => _data.tabId === tabId);
                }
                webviewData && this.removePreview(webviewData.webview.id);
            }
        };
        // 'https://clearthis.page/?u='; stopped service?
        // change also in dialog.css => &:has(webview[src^="READER_VIEW_URL"]) .reader-view-toggle
        // alternative => https://www.smry.ai/proxy?url=
        READER_VIEW_URL = 'https://app.web-highlights.com/reader/open-website-in-reader-mode?url=';

        constructor() {
            // Setup keyboard shortcuts
            vivaldi.tabsPrivate.onKeyboardShortcut.addListener(this.keyCombo.bind(this));

            new WebsiteInjectionUtils(
                navigationDetails => this.getWebviewConfig(navigationDetails),
                (url, fromPanel, origin) => this.dialogTab(url, fromPanel, origin), // pass origin through
                ICON_CONFIG
            );
        }

        /**
         * Finds the correct configuration for showing the dialog
         */
        getWebviewConfig(navigationDetails) {
            if (navigationDetails.frameType !== 'outermost_frame') {
                return { webview: null, fromPanel: false };
            }

            const tabSelector = `webview[tab_id="${navigationDetails.tabId}"]`;
            const webview = document.querySelector(tabSelector);

            if (webview) {
                return {
                    webview,
                    fromPanel: webview.name === 'vivaldi-webpanel'
                };
            }

            const panelView = [...this.webviews.values()]
                .find(v => v.fromPanel)?.webview;

            if (panelView) {
                return { webview: panelView, fromPanel: true };
            }

            const active = this.getActiveWebview();
            const lastId =
                active?.closest('.dialog-container')
                    ?.querySelector('webview')?.id;

            return {
                webview: this.webviews.get(lastId)?.webview,
                fromPanel: false
            };
        }

        getActiveWebview() {
            return document.querySelector('.active.visible.webpageview webview');
        }
        /**
         * Open Default Search Engine in Preview and search for the selected text
         * @returns {Promise<void>}
         */
        async searchForSelectedText() {
            const tabs = await chrome.tabs.query({ active: true });
            const tab = tabs[0];

            vivaldi.utilities.getSelectedText(
                tab.id,
                text => this.dialogTabSearch(this.searchEngineUtils.defaultSearchId, text)
            );
        }

        /**
         * Prepares url for search, calls dialogTab function
         * @param {String} engineId engine id of the engine to be used
         * @param {int} selectionText the text to search
         */
        async dialogTabSearch(engineId, selectionText) {
            const searchRequest =
                await vivaldi.searchEngines.getSearchRequest(engineId, selectionText);

            this.dialogTab(searchRequest.url);
        }

        /**
         * Handle a potential keyboard shortcut (copy from KeyboardMachine)
         * @param {number} id I don't know what this does, but it's an extra argument
         * @param {String} combination written in the form (CTRL+SHIFT+ALT+KEY)
         */
        keyCombo(_, combination) {
            if (!combination) return;

            const normalized = combination
                .replace('Key', '')
                .replace('Period', '.')
                .replace('Comma', ',')
                .replace('Slash', '/')
                .replace(/\s+/g, '');

            const handler =
                this.KEYBOARD_SHORTCUTS[combination] ||
                this.KEYBOARD_SHORTCUTS[normalized];

            if (handler) handler();
        }

        /**
         * Removes the dialog for a given webview
         * @param webviewId The id of the webview
         */
        removePreview(webviewId) {
            const data = this.webviews.get(webviewId);
            if (!data) return;

            const container = data.divContainer;
            const dialogTab = container.querySelector('.dialog-tab');

            if (container.dataset.closing === '1') return;
            container.dataset.closing = '1';

            const pointerX = Number(container.dataset.pointerX ?? window.innerWidth / 2);
            const pointerY = Number(container.dataset.pointerY ?? window.innerHeight / 2);

            // Recompute anchored translate for current layout
            this.setAnchoredTransformVars(dialogTab, pointerX, pointerY);

            requestAnimationFrame(() => {
                container.classList.remove('is-open'); // overlay fades out via transition
                container.classList.add('is-leave'); // optional: block clicks
                // remove blur immediately so background is crisp while closing
                container.style.backdropFilter = 'none';

                dialogTab.classList.add('animating-close');

                const finishRemoval = () => {
                    chrome.tabs.query({}, tabs => {
                        const tab = tabs.find(tab => tab.vivExtData && tab.vivExtData.includes(`${webviewId}tabId`));
                        if (tab) chrome.tabs.remove(tab.id);
                    });

                    container.classList.remove('is-leave');
                    data.divContainer.remove();

                    // Clean up event listeners
                    if (data.tabCloseListener) {
                        chrome.tabs.onRemoved.removeListener(data.tabCloseListener);
                    }
                    if (data.pointerdownListener && data.fromPanel) {
                        document.body.removeEventListener('pointerdown', data.pointerdownListener);
                    }

                    this.webviews.delete(webviewId);
                };

                const onCloseEnd = e => {
                    if (e.animationName === 'dialog-tab-close-anchored') {
                        dialogTab.removeEventListener('animationend', onCloseEnd);
                        finishRemoval();
                    }
                };
                dialogTab.addEventListener('animationend', onCloseEnd);

                // Fallback in case animationend doesn't fire
                setTimeout(finishRemoval, this.ANIMATION_DURATIONS.CLOSE_TIMEOUT);
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
                chrome.windows.getCurrent(current => {
                    const isValidWindow =
                        window.id === current.id &&
                        window.state !== chrome.windows.WindowState.MINIMIZED;

                    if (isValidWindow) {
                        this.showPreview(linkUrl, fromPanel, origin);
                    }
                });
            });
        }

        /**
         * Opens a link in a dialog like display in the current visible tab
         * @param {string} linkUrl the url to load
         * @param {boolean} fromPanel indicates whether the dialog is opened from a panel
         * @param {{x:number, y:number}} origin the viewport coordinates to anchor the animation
         */

        showPreview(linkUrl, fromPanel, origin) {
            const dialogContainer = document.createElement('div'),
                dialogTab = document.createElement('div'),
                webview = document.createElement('webview'),
                webviewId = `dialog-${this.getWebviewId()}`,
                progressBar = new ProgressBar(webviewId),
                optionsContainer = document.createElement('div');

            if (fromPanel === undefined && this.webviews.size !== 0) {
                fromPanel = Array.from(this.webviews.values()).at(-1).fromPanel;
            }

            const tabId = !fromPanel ? Number(document.querySelector('.active.visible.webpageview webview').tab_id) : null;

            this.webviews.set(webviewId, {
                divContainer: dialogContainer,
                webview: webview,
                fromPanel: fromPanel,
                tabId: tabId,
                pointerdownListener: null,
                pointerdownAttached: false
            });

            // remove dialogs when tab is closed without closing dialogs
            if (!fromPanel) {
                const clearWebviews = closedTabId => {
                    if (tabId === closedTabId) {
                        this.webviews.forEach((view, key) => view.tabCloseListener === clearWebviews && this.removePreview(key));
                        chrome.tabs.onRemoved.removeListener(clearWebviews);
                    }
                };
                this.webviews.get(webviewId).tabCloseListener = clearWebviews;
                chrome.tabs.onRemoved.addListener(clearWebviews);
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

            let pageTitle = linkUrl; // fallback so it's never empty
            const fadeDuration = 300; // match css value (0.3s)
            let timeout;
            let showingOptions = false;

            optionsContainer.textContent = pageTitle;

            optionsContainer.addEventListener('mouseover', () => {
                if (!showingOptions) {
                    optionsContainer.classList.add('fade-out');

                    setTimeout(() => {
                        optionsContainer.innerHTML = '';
                        this.showWebviewOptions(webviewId, optionsContainer);

                        optionsContainer.classList.remove('fade-out');
                        showingOptions = true;
                    }, fadeDuration);
                }

                clearTimeout(timeout);
            });

            optionsContainer.addEventListener('mouseleave', () => {
                timeout = setTimeout(() => {
                    optionsContainer.classList.add('fade-out');

                    setTimeout(() => {
                        optionsContainer.textContent = pageTitle;

                        optionsContainer.classList.remove('fade-out');
                        showingOptions = false;
                    }, fadeDuration);

                }, this.ANIMATION_DURATIONS.OPTIONS_HIDE);
            });
            //#endregion

            //#region webview properties
            let currentPageUrl = ''; // Track the current page URL
            let titleFetched = false; // Flag to ensure title is fetched only once per page

            webview.id = webviewId;
            webview.tab_id = `${webviewId}tabId`;
            webview.setAttribute('src', linkUrl);

            // Track the current page URL to prevent fetching the wrong title
            currentPageUrl = linkUrl;
            titleFetched = false;  // Reset the flag when a new page is being loaded

            // Track if the webview is still loading
            let isLoading = false;

            webview.addEventListener('loadstart', () => {
                webview.style.backgroundColor = 'var(--colorBorder)';
                progressBar.start();

                const input = document.getElementById(`input-${webview.id}`);
                if (input !== null) {
                    input.value = webview.src;
                }

                // Mark the page as loading
                isLoading = true;
            });

            webview.addEventListener('loadcommit', () => {
                titleFetched = false;
                progressBar.clear(true);
            });

            webview.addEventListener('loadstop', () => {
                progressBar.clear(true);

                const expectedSrc = webview.src; // snapshot (IMPORTANT)

                setTimeout(() => {
                    let title = '';

                    try {
                        if (webview.getTitle) {
                            title = webview.getTitle();
                        }

                        if (!title) {
                            webview.executeScript({ code: 'document.title' }, (results) => {
                                if (!results || !results[0]) return;

                                const resolvedTitle = results[0];

                                // ONLY apply if still same page
                                if (webview.src === expectedSrc && resolvedTitle) {
                                    pageTitle = resolvedTitle;
                                    titleFetched = true;

                                    if (!showingOptions) {
                                        optionsContainer.textContent = pageTitle;
                                    }
                                }
                            });
                        } else {
                            if (webview.src === expectedSrc) {
                                pageTitle = title;
                                titleFetched = true;

                                if (!showingOptions) {
                                    optionsContainer.textContent = pageTitle;
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Title fetch failed:', e);
                    }
                }, 300);
            });
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
                    const text = inputElement.value;
                    let low = 0,
                        high = text.length;

                    this.#canvasContext.font = window.getComputedStyle(inputElement).font;

                    while (low < high) {
                        const mid = (low + high) >> 1;
                        const width = this.#canvasContext.measureText(text.slice(0, mid)).width;

                        if (width < offsetX) low = mid + 1;
                        else high = mid;
                    }

                    const cursorPosition = low;

                    // Manually focus the input element and set the cursor position
                    inputElement.focus({ preventScroll: true });
                    inputElement.setSelectionRange(cursorPosition, cursorPosition);
                }
            };

            if (fromPanel) {
                document.body.addEventListener('pointerdown', stopEvent);
                // Store listener reference for cleanup
                this.webviews.get(webviewId).pointerdownListener = stopEvent;
            }

            dialogContainer.addEventListener('click', event => {
                if (event.target === dialogContainer) {
                    this.removePreview(webviewId);
                }
            });

            //#endregion

            dialogTab.appendChild(optionsContainer);
            dialogTab.appendChild(progressBar.element);
            dialogTab.appendChild(webview);

            dialogContainer.appendChild(dialogTab);

            (fromPanel ? (this.rootBrowser || document.querySelector('#browser')) : document.querySelector('.active.visible.webpageview')).appendChild(dialogContainer);

            // Two-frame start: measure anchored start, then overlay, then animate with a tiny delay
            requestAnimationFrame(() => {
                const t = this.setAnchoredTransformVars(dialogTab, pointerX, pointerY); // sets --tx0/--ty0/--s0 and returns numbers
                // show anchored start inline immediately
                dialogTab.style.transform = `translate(${t.t0x}px, ${t.t0y}px) scale(${t.s0})`;
                dialogTab.style.opacity = '0';
                dialogTab.style.visibility = 'visible';
                requestAnimationFrame(() => {
                    dialogTab.getBoundingClientRect();

                    requestAnimationFrame(() => {
                        dialogContainer.classList.add('is-open');
                    });
                });

                requestAnimationFrame(() => {
                    dialogContainer.classList.add('is-open');
                    setTimeout(() => {
                        dialogTab.classList.add('animating-open');

                        const onOpenEnd = e => {
                            if (e.animationName === 'dialog-tab-open-anchored') {
                                dialogTab.classList.remove('animating-open');
                                // cleanup inline styles
                                dialogTab.style.removeProperty('transform');
                                dialogTab.style.removeProperty('opacity');
                                dialogTab.removeEventListener('animationend', onOpenEnd);
                            }
                        };
                        dialogTab.addEventListener('animationend', onOpenEnd);
                    }, this.ANIMATION_DURATIONS.FADE_DELAY);
                });
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

            return { t0x, t0y, s0 };
        }

        /**
         * Displays open in tab buttons and current url in input element
         * @param {string} webviewId is the id of the webview
         * @param {Object} thisElement the current instance divOptionContainer (div) element
         */
        showWebviewOptions(webviewId, thisElement) {
            let inputId = `input-${webviewId}`,
                data = this.webviews.get(webviewId),
                webview = data ? data.webview : undefined;
            if (webview && document.getElementById(inputId) === null) {
                const input = document.createElement('input', 'text'),
                    // Allowed URL schemes for webview navigation
                    VALID_URL_PREFIXES = ['http://', 'https://', 'file://', 'vivaldi://', 'chrome://', 'chrome-extension://', 'data:', 'blob:'],
                    // Blocked schemes that could be dangerous
                    BLOCKED_SCHEMES = ['javascript:', 'vbscript:'],
                    isValidUrl = url => {
                        if (!url || typeof url !== 'string') return false;
                        const trimmedUrl = url.trim();

                        // Check for blocked schemes first
                        if (BLOCKED_SCHEMES.some(scheme => trimmedUrl.toLowerCase().startsWith(scheme))) {
                            return false;
                        }

                        // Allow about: pages
                        if (trimmedUrl.startsWith('about:')) return true;

                        // Check valid prefixes
                        return VALID_URL_PREFIXES.some(prefix => trimmedUrl.startsWith(prefix));
                    };

                input.value = webview.src;
                input.id = inputId;
                input.setAttribute('class', 'dialog-input');

                input.addEventListener('keydown', async event => {
                    if (event.key === 'Enter') {
                        let value = input.value;
                        if (isValidUrl(value)) {
                            webview.src = value;
                        } else {
                            const searchRequest = await vivaldi.searchEngines.getSearchRequest(this.searchEngineUtils.defaultSearchId, value);
                            webview.src = searchRequest.url;
                        }
                    }
                });

                const fragment = document.createDocumentFragment(),
                    buttons = [
                        { content: this.iconUtils.back, action: () => webview.back(), tooltip: 'Back' },
                        { content: this.iconUtils.forward, action: () => webview.forward(), tooltip: 'Forward' },
                        { content: this.iconUtils.reload, action: () => webview.reload(), tooltip: 'Reload page' },
                        {
                            content: this.iconUtils.readerView,
                            action: this.showReaderView.bind(this, webview),
                            cls: 'reader-view-toggle',
                            tooltip: 'Toggle Reader View'
                        },
                        { content: this.iconUtils.newTab, action: () => this.openNewTab(inputId, true), tooltip: 'Open in new tab' },
                        { content: this.iconUtils.backgroundTab, action: () => this.openNewTab(inputId, false), tooltip: 'Open in background tab' }
                    ];

                buttons.forEach(button =>
                    fragment.appendChild(
                        this.createOptionsButton(
                            button.content,
                            button.action,
                            button.cls || '',
                            button.tooltip
                        )
                    )
                );
                fragment.appendChild(input);

                thisElement.append(fragment);
            }
        }

        /**
         * Create a button with default style for the web view options.
         * @param {Node | string} content the content of the button to display
         * @param {Function} clickListenerCallback the click listeners callback function
         * @param {string} cls optional additional class for the button
         */
        createOptionsButton(content, clickListenerCallback, cls = '', tooltip = '') {
            const button = document.createElement('button');

            button.className = `options-button ${cls}`.trim();
            button.addEventListener('click', clickListenerCallback);

            if (tooltip) {
                button.dataset.tooltip = tooltip;
            }

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
        showReaderView(webview) {
            const dialogTab = webview.parentElement;
            if (webview.src.includes(this.READER_VIEW_URL)) {
                webview.src = webview.src.replace(this.READER_VIEW_URL, '');
                dialogTab.classList.remove('reader-open');
            } else {
                webview.src = this.READER_VIEW_URL + webview.src;
                dialogTab.classList.add('reader-open');
            }
        }

        /**
         * Opens a new Chrome tab with specified active boolean value
         * @param {string} inputId is the id of the input containing current url
         * @param {boolean} active indicates whether the tab is active or not (background tab)
         */
        openNewTab(inputId, active) {
            const url = document.getElementById(inputId).value;
            chrome.tabs.create({ url: url, active: active });
        }
    }

    class WebsiteInjectionUtils {
        constructor(getWebviewConfig, openPreview, iconConfig) {
            this.iconConfig = JSON.stringify(iconConfig);

            // inject detection of click observers
            chrome.webNavigation.onCompleted.addListener(navigationDetails => {
                const { webview, fromPanel } = getWebviewConfig(navigationDetails);
                webview && this.injectCode(webview, fromPanel);
            });

            // react on demand to open a dialog
            chrome.runtime.onMessage.addListener(message => {
                if (message.url) {
                    openPreview(message.url, message.fromPanel, message.origin);
                }
            });
        }

        injectCode(webview, fromPanel) {
            const handler = WebsiteLinkInteractionHandler.toString();

            const instantiationCode = `
                if (window.__dialogHandlerInitialized) return;
                window.__dialogHandlerInitialized = true;

                new (${handler})(${fromPanel}, ${this.iconConfig});
`;

            try {
                webview.executeScript({ code: instantiationCode }, () => {
                    if (chrome.runtime.lastError) {
                        // Script injection failed (e.g., on chrome:// pages or blocked by CSP)
                        console.debug('Preview mod: Script injection failed:', chrome.runtime.lastError.message);
                    }
                });
            } catch (error) {
                console.debug('Preview mod: Failed to execute script:', error);
            }
        }
    }

    class WebsiteLinkInteractionHandler {
        constructor(fromPanel, config) {
            this.fromPanel = fromPanel;
            this.config = config;
            this.icon = null;
            this.timers = { showIcon: null, showPreview: null, hideIcon: null };
            this.boundHideIcon = this.#hideLinkIcon.bind(this);
            this.#initialize();
        }

        /**
         * Checks if a link is clicked by the middle mouse while pressing Ctrl + Alt, then fires an event with the Url
         */
        #initialize() {
            this.#setupMouseHandling();

            if (this.config.linkIcon) {
                this.#setupIconHandling();
            }
        }

        /**
         * Sets up the mouse event listeners
         */
        #setupMouseHandling() {
            let holdTimerForMiddleClick;

            document.addEventListener('pointerdown', event => {
                // Check if the Ctrl key, Alt key, and mouse button were pressed
                if (event.ctrlKey && event.altKey && [0, 1].includes(event.button)) {
                    this.#callPreview(event);
                } else if (event.button === 1) {
                    // MMB-hold: cache link+coords NOW, use after timeout (prevents drift)
                    const link = this.#getLinkElement(event);
                    if (!link) return;
                    const px = event.clientX,
                        py = event.clientY;
                    const href = link.href;
                    holdTimerForMiddleClick = setTimeout(() => {
                        this.#sendPreviewMessage(href, px, py);
                    }, 500);
                }
            });

            document.addEventListener('pointerup', event => {
                if (event.button === 1) clearTimeout(holdTimerForMiddleClick);
            });
        }

        #setupIconHandling() {
            this.#createIcon();
            this.#createIconStyle();

            document.addEventListener(
                'mouseover',
                this.debounce(event => {
                    const link = this.#getLinkElement(event);
                    if (!link) return;

                    clearTimeout(this.timers.hideIcon);

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
                }, this.config.showIconDelay)
            );
        }

        #createIcon() {
            const icon = document.createElement('div');
            icon.className = `link-icon ${this.config.linkIcon}`;
            icon.style.display = 'none';

            const getLinkCenter = () => {
                const el = this.currentLinkEl;
                if (el) {
                    const r = el.getBoundingClientRect();
                    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
                }
                return { x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2) };
            };

            if (this.config.linkIconInteractionOnHover) {
                icon.addEventListener('mouseenter', () => {
                    this.timers.showPreview = setTimeout(() => {
                        const { x, y } = getLinkCenter();
                        this.#sendPreviewMessage(this.icon.dataset.targetUrl, x, y);
                    }, this.config.showPreviewOnHoverDelay);
                });
                icon.addEventListener('mouseleave', () => clearTimeout(this.timers.showPreview));
            } else {
                icon.addEventListener('click', () => {
                    const { x, y } = getLinkCenter();
                    this.#sendPreviewMessage(this.icon.dataset.targetUrl, x, y);
                });
                icon.addEventListener('mouseenter', () => clearTimeout(this.timers.hideIcon));
                icon.addEventListener('mouseleave', this.#hideLinkIcon.bind(this));
            }

            this.icon = icon;
            document.body.appendChild(this.icon);
        }

        #hideLinkIcon() {
            this.timers.hideIcon = setTimeout(
                () => {
                    this.icon.style.display = 'none';
                    clearTimeout(this.timers.showIcon);
                },
                this.config.linkIconInteractionOnHover ? 300 : 600
            );
        }

        #getLinkElement(event) {
            return event.target.closest('a[href]:not([href="#"])');
        }

        #sendPreviewMessage(url, x, y) {
            chrome.runtime.sendMessage({ url, fromPanel: this.fromPanel, origin: { x, y } });
        }

        #callPreview(event) {
            let link = this.#getLinkElement(event);
            if (link) {
                event.preventDefault();
                this.#sendPreviewMessage(link.href, event.clientX, event.clientY);
            }
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

        debounce(fn, delay) {
            let timer = null;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(fn.bind(this, ...args), delay);
            };
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
         * @param {string} [config.linkMenuTitle] - Titel for the link menu
         * @param {string} [config.searchMenuTitle] - title for the search menu
         * @param {string} [config.selectSearchMenuTitle] - title for the select search menu
         */
        constructor(openLinkCallback, searchCallback, config = {}) {
            this.openLinkCallback = openLinkCallback;
            this.searchCallback = searchCallback;


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
                title: `${this.linkMenuTitle}`,
                contexts: ['link']
            });
            chrome.contextMenus.create({
                id: this.SEARCH_ID,
                title: `${this.searchMenuTitle}`,
                contexts: ['selection']
            });
            chrome.contextMenus.create({
                id: this.SELECT_SEARCH_ID,
                title: `${this.selectSearchMenuTitle}`,
                contexts: ['selection']
            });

            chrome.contextMenus.onClicked.addListener(itemInfo => {
                const { menuItemId, parentMenuItemId, linkUrl, selectionText } = itemInfo;

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

    class ProgressBar {
        static CLEAR_DELAY = 250; // Delay before hiding progress bar after completion

        constructor(webviewId) {
            this.webviewId = webviewId;
            this.progress = 0;
            this.interval = null;
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

            if (!this.interval) {
                this.interval = setInterval(() => {
                    if (this.progress >= 100) {
                        this.clear();
                    } else {
                        this.progress++;
                        this.element.style.width = this.progress + '%';
                    }
                }, 10);
            }
        }

        clear(loadStop = false) {
            this.element.classList.add('is-complete');

            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }

            if (loadStop) {
                this.element.style.width = '100%';

                setTimeout(() => {
                    this.progress = 0;
                    this.element.style.visibility = 'hidden';
                    this.element.style.width = this.progress + '%';
                }, ProgressBar.CLEAR_DELAY);
            }
        }
    }

    /**
     * Utility class to manage SVG icons
     * @class
     */
    class IconUtils {
        // Static icons
        static SVG = {
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
        get newTab() {
            return this.getIcon('newTab');
        }
        get backgroundTab() {
            return this.getIcon('backgroundTab');
        }
    }
})();
