//
//  Markdown Editor for Notes
//  Written by Tam710562 and sjudenim
//  GNU General Public License v3.0
//
// Adds a markdwon toolbar to the notes editor
//

(function () {
    const buttons = [
        {
            name: 'Bold',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 384 512"><path d="M304.793 243.891c33.639-18.537 53.657-54.16 53.657-95.693 0-48.236-26.25-87.626-68.626-104.179C265.138 34.01 240.849 32 209.661 32H24c-8.837 0-16 7.163-16 16v33.049c0 8.837 7.163 16 16 16h33.113v318.53H24c-8.837 0-16 7.163-16 16V464c0 8.837 7.163 16 16 16h195.69c24.203 0 44.834-1.289 66.866-7.584C337.52 457.193 376 410.647 376 350.014c0-52.168-26.573-91.684-71.207-106.123zM142.217 100.809h67.444c16.294 0 27.536 2.019 37.525 6.717 15.828 8.479 24.906 26.502 24.906 49.446 0 35.029-20.32 56.79-53.029 56.79h-76.846V100.809zm112.642 305.475c-10.14 4.056-22.677 4.907-31.409 4.907h-81.233V281.943h84.367c39.645 0 63.057 25.38 63.057 63.057.001 28.425-13.66 52.483-34.782 61.284z"></path></svg>',
            markdown: '**',
            wrap: true,
            textDefault: 'bold text',
        },
        {
            name: 'Italic',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 320 512"><path d="M204.758 416h-33.849l62.092-320h40.725a16 16 0 0 0 15.704-12.937l6.242-32C297.599 41.184 290.034 32 279.968 32H120.235a16 16 0 0 0-15.704 12.937l-6.242 32C96.362 86.816 103.927 96 113.993 96h33.846l-62.09 320H46.278a16 16 0 0 0-15.704 12.935l-6.245 32C22.402 470.815 29.967 480 40.034 480h158.479a16 16 0 0 0 15.704-12.935l6.245-32c1.927-9.88-5.638-19.065-15.704-19.065z"></path></svg>',
            markdown: '*',
            wrap: true,
            textDefault: 'italicized text',
        },
        {
            name: 'Strikethrough',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 512 512"><path d="M496 288H16c-8.837 0-16-7.163-16-16v-32c0-8.837 7.163-16 16-16h480c8.837 0 16 7.163 16 16v32c0 8.837-7.163 16-16 16zm-214.666 16c27.258 12.937 46.524 28.683 46.524 56.243 0 33.108-28.977 53.676-75.621 53.676-32.325 0-76.874-12.08-76.874-44.271V368c0-8.837-7.164-16-16-16H113.75c-8.836 0-16 7.163-16 16v19.204c0 66.845 77.717 101.82 154.487 101.82 88.578 0 162.013-45.438 162.013-134.424 0-19.815-3.618-36.417-10.143-50.6H281.334zm-30.952-96c-32.422-13.505-56.836-28.946-56.836-59.683 0-33.92 30.901-47.406 64.962-47.406 42.647 0 64.962 16.593 64.962 32.985V136c0 8.837 7.164 16 16 16h45.613c8.836 0 16-7.163 16-16v-30.318c0-52.438-71.725-79.875-142.575-79.875-85.203 0-150.726 40.972-150.726 125.646 0 22.71 4.665 41.176 12.777 56.547h129.823z"></path></svg>',
            markdown: '~~',
            wrap: true,
            textDefault: 'strikethrough text',
        },
        {
            name: 'Underline',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 16"><path d="M.5.5v2h1.25v6c0 2.758 2.805 5 6.25 5s6.25-2.242 6.25-5v-6h1.25v-2h-5v2h1.25v6c0 1.656-1.682 3.002-3.75 3.002S4.25 10.156 4.25 8.5v-6H5.5v-2h-5zM.5 14v2h15v-2H.5z"></path></svg>',
            markdown: '++',
            wrap: true,
            textDefault: 'underline text',
        },
        {
            name: 'Highlight',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 544 512"><path d="M0 479.98L99.92 512l35.45-35.45-67.04-67.04L0 479.98zm124.61-240.01a36.592 36.592 0 0 0-10.79 38.1l13.05 42.83-50.93 50.94 96.23 96.23 50.86-50.86 42.74 13.08c13.73 4.2 28.65-.01 38.15-10.78l35.55-41.64-173.34-173.34-41.52 35.44zm403.31-160.7l-63.2-63.2c-20.49-20.49-53.38-21.52-75.12-2.35L190.55 183.68l169.77 169.78L530.27 154.4c19.18-21.74 18.15-54.63-2.35-75.13z"></path></svg>',
            markdown: '==',
            wrap: true,
            textDefault: 'highlight text',
        },
        {
            name: 'Header',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 512 512"><path d="M496 80V48c0-8.837-7.163-16-16-16H320c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16h37.621v128H154.379V96H192c8.837 0 16-7.163 16-16V48c0-8.837-7.163-16-16-16H32c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16h37.275v320H32c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16h160c8.837 0 16-7.163 16-16v-32c0-8.837-7.163-16-16-16h-37.621V288H357.62v128H320c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16h160c8.837 0 16-7.163 16-16v-32c0-8.837-7.163-16-16-16h-37.275V96H480c8.837 0 16-7.163 16-16z"></path></svg>',
            markdown: '# ',
            newline: true,
            textDefault: 'header text',
        },
        {
            name: 'Header 2',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 16"><path d="M.5 1.5v.764h.266c.232 0 .45.015.658.04.209.028.39.086.547.175a.991.991 0 01.375.376c.092.165.138.379.138.645v8.924c0 .288-.044.515-.132.687a.97.97 0 01-.37.397 1.473 1.473 0 01-.546.183c-.21.027-.43.043-.668.043H.5v.766H6.777v-.762h-.185v-.004h-.104a3.884 3.884 0 01-.525-.04c-.183-.03-.34-.091-.475-.182a.968.968 0 01-.316-.397c-.08-.172-.12-.4-.12-.685V8.16h.227c-.126 0-.226.034-.226.074 0 .04.1.073.226.073h5.633c.015 0 .023-.005.037-.006v4.127c0 .286-.039.513-.119.685a.98.98 0 01-.318.397 1.14 1.14 0 01-.473.181 3.754 3.754 0 01-.55.043h-.08v.002h-.186v.764H15.5v-.766h-.268c-.23 0-.45-.014-.658-.04-.21-.026-.39-.08-.547-.165a.914.914 0 01-.373-.369c-.09-.163-.138-.376-.138-.644V3.572c0-.285.043-.512.132-.683a.958.958 0 01.37-.397c.158-.092.338-.152.546-.181.21-.031.431-.045.67-.045h.264V1.5H9.221v.766h.24c.207 0 .397.015.578.045.181.03.34.09.473.181a.956.956 0 01.316.395c.08.172.121.4.121.685v3.532H5.053V3.572c0-.284.038-.511.119-.683a.948.948 0 01.316-.397c.134-.092.293-.153.475-.183a3.7 3.7 0 01.576-.043h.238V1.5h-.185zm10.412 6.66h.037v.006c-.014 0-.022-.006-.037-.006z"></path></svg>',
            markdown: '## ',
            newline: true,
            textDefault: 'header 2 text',
        },
        {
            name: 'Header 3',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 16"><path d="M1.5 2.5v.646h.23c.2 0 .392.012.57.034.18.023.34.072.475.148.136.075.245.18.325.318.08.14.119.322.119.547v7.551c0 .244-.038.437-.115.582a.815.815 0 01-.319.334 1.308 1.308 0 01-.474.156 4.59 4.59 0 01-.58.036H1.5v.648H6.967v-.646h-.19v-.002H6.74a3.364 3.364 0 01-.463-.036.97.97 0 01-.4-.154.793.793 0 01-.27-.336c-.069-.144-.101-.338-.101-.58V8.439h4.99v3.309c0 .242-.033.435-.101.58a.821.821 0 01-.272.334.956.956 0 01-.398.154 3.266 3.266 0 01-.463.036h-.04v.002h-.189v.646H14.5v-.648h-.23c-.2 0-.39-.013-.57-.034a1.341 1.341 0 01-.475-.14.774.774 0 01-.325-.313c-.079-.139-.119-.32-.119-.547V4.254c0-.242.038-.435.115-.58a.815.815 0 01.319-.334 1.29 1.29 0 01.474-.156 4.09 4.09 0 01.58-.038h.229V2.5H9.033v.646h.203c.176 0 .339.015.489.04a.958.958 0 01.396.154.786.786 0 01.272.334c.069.145.101.338.101.58v2.885h-4.99V4.254c0-.242.032-.435.101-.58a.793.793 0 01.272-.334.977.977 0 01.4-.156c.156-.025.318-.038.487-.038h.203V2.5h-.19z"></path></svg>',
            markdown: '### ',
            newline: true,
            textDefault: 'header 3 text',
        },
        {
            name: 'Blockquote',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"></path></svg>',
            markdown: '> ',
            newline: true,
            textDefault: 'blockquote',
        },
        {
            name: 'Ordered List',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" version="1.0" height="16" width="16"><path d="M5.97 3l-.314.344S4.9 4 4.406 4v2c.68 0 1.15-.276 1.594-.53V10h2V3H5.97zM11 6v2h17V6H11zm-4.5 6C5.117 12 4 13.117 4 14.5v.5h2v-.5c0-.217.283-.5.5-.5.217 0 .5.283.5.5l-.03.03-.064.064-2.593 2.5-.313.28V19h5v-2H7.28l.876-.875.125-.094-.03-.03c.502-.41.75-1.02.75-1.5C9 13.117 7.883 12 6.5 12zm4.5 3v2h17v-2H11zm-7 6v2h1.375l-.25.406-.125.22V25h1.5c.217 0 .5.283.5.5 0 .217-.283.5-.5.5H4v2h2.5C7.883 28 9 26.883 9 25.5c0-1.005-.678-1.696-1.53-2.094l.405-.687.125-.25V21H4zm7 3v2h17v-2H11z"></path></svg>',
            markdown: '1. ',
            newline: true,
            textDefault: 'item',
        },
        {
            name: 'Unordered List',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" version="1.1" height="16" width="16"><path d="M 6 5 C 4.894531 5 4 5.894531 4 7 C 4 8.105469 4.894531 9 6 9 C 7.105469 9 8 8.105469 8 7 C 8 5.894531 7.105469 5 6 5 Z M 11 6 L 11 8 L 28 8 L 28 6 Z M 6 14 C 4.894531 14 4 14.894531 4 16 C 4 17.105469 4.894531 18 6 18 C 7.105469 18 8 17.105469 8 16 C 8 14.894531 7.105469 14 6 14 Z M 11 15 L 11 17 L 28 17 L 28 15 Z M 6 23 C 4.894531 23 4 23.894531 4 25 C 4 26.105469 4.894531 27 6 27 C 7.105469 27 8 26.105469 8 25 C 8 23.894531 7.105469 23 6 23 Z M 11 24 L 11 26 L 28 26 L 28 24 Z "></path></svg>',
            markdown: '- ',
            newline: true,
            textDefault: 'item',
        },
        {
            name: 'Code',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M24 10.935v2.131l-8 3.947v-2.23l5.64-2.783-5.64-2.79v-2.223l8 3.948zm-16 3.848l-5.64-2.783 5.64-2.79v-2.223l-8 3.948v2.131l8 3.947v-2.23zm7.047-10.783h-2.078l-4.011 16h2.073l4.016-16z"></path></svg>',
            markdown: '`',
            wrap: true,
            textDefault: 'code',
        },
        {
            name: 'Link',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 24 24"><path d="M13.723 18.654l-3.61 3.609c-2.316 2.315-6.063 2.315-8.378 0-1.12-1.118-1.735-2.606-1.735-4.188 0-1.582.615-3.07 1.734-4.189l4.866-4.865c2.355-2.355 6.114-2.262 8.377 0 .453.453.81.973 1.089 1.527l-1.593 1.592c-.18-.613-.5-1.189-.964-1.652-1.448-1.448-3.93-1.51-5.439-.001l-.001.002-4.867 4.865c-1.5 1.499-1.5 3.941 0 5.44 1.517 1.517 3.958 1.488 5.442 0l2.425-2.424c.993.284 1.791.335 2.654.284zm.161-16.918l-3.574 3.576c.847-.05 1.655 0 2.653.283l2.393-2.389c1.498-1.502 3.94-1.5 5.44-.001 1.517 1.518 1.486 3.959 0 5.442l-4.831 4.831-.003.002c-1.438 1.437-3.886 1.552-5.439-.002-.473-.474-.785-1.042-.956-1.643l-.084.068-1.517 1.515c.28.556.635 1.075 1.088 1.528 2.245 2.245 6.004 2.374 8.378 0l4.832-4.831c2.314-2.316 2.316-6.062-.001-8.377-2.317-2.321-6.067-2.313-8.379-.002z"></path></svg>',
            markdown: ['[', '](https://www.example.com)'],
            textDefault: 'title',
        },
        {
            name: 'Image',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 512 512"><path d="M464 448H48c-26.51 0-48-21.49-48-48V112c0-26.51 21.49-48 48-48h416c26.51 0 48 21.49 48 48v288c0 26.51-21.49 48-48 48zM112 120c-30.928 0-56 25.072-56 56s25.072 56 56 56 56-25.072 56-56-25.072-56-56-56zM64 384h384V272l-87.515-87.515c-4.686-4.686-12.284-4.686-16.971 0L208 320l-55.515-55.515c-4.686-4.686-12.284-4.686-16.971 0L64 336v48z"></path></svg>',
            markdown: ['![', '](image.jpg)'],
            textDefault: 'alt text',
        },
        /* Custom buttons */
    ];

    function addStyle(css) {
        const style = document.createElement('style');
        style.id = 'markdown-editor'
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    function insertAtCursor (input, textToInsert, info) {
        input.focus();
        let sel1 = input.selectionStart;
        let sel2 = input.selectionEnd;
        const text = input.value;
        const breakLine = (info.newline === true && sel1 !== 0) ? '\n' : '';
        let sel = text.substring(sel1, sel2);
        if (sel.length === 0 && info.textDefault) {
            sel = info.textDefault;
        }
        document.execCommand('insertText', false, breakLine + textToInsert + sel);
        sel1 = sel1 + breakLine.length + textToInsert.length;
        sel2 = sel1 + sel.length;
        input.setSelectionRange(sel1, sel2);
    }
    
    function insertWrapAtCursor(input, tag1, tag2, info) {
        input.focus();
        let sel1 = input.selectionStart;
        let sel2 = input.selectionEnd;
        const text = input.value;
        const breakLine = (info.newline === true && sel1 !== 0) ? '\n' : '';
        let sel = text.substring(sel1, sel2);
        if (sel.length === 0 && info.textDefault) {
            sel = info.textDefault;
        }
        document.execCommand('insertText', false, breakLine + tag1 + sel + tag2);
        sel1 = sel1 + breakLine.length + tag1.length;
        sel2 = sel1 + sel.length;
        input.setSelectionRange(sel1, sel2);
    }

    function createButton(info) {
        const button = document.createElement('button');
        button.className = 'notes-custom';
        button.title = info.name;
        button.innerHTML = info.icon;
        button.tabIndex = -1;
        button.addEventListener('click', function (event) {
            event.stopPropagation();
            const noteEditor = document.querySelector('.cardview .NotesEditor-Editor');
            if (noteEditor) {
                if (Array.isArray(info.markdown)) {
                    insertWrapAtCursor(noteEditor, info.markdown[0], info.markdown[1], info);
                } else if (info.wrap && typeof info.markdown === 'string') {
                    insertWrapAtCursor(noteEditor, info.markdown, info.markdown, info);
                } else if (typeof info.markdown === 'function') {
                    insertAtCursor(noteEditor, info.markdown(), info);
                } else {
                    insertAtCursor(noteEditor, info.markdown, info);
                }
            }
        });
        return button;
    }

    function markdownEditor() {
        const addAttachmentsWrapper = document.querySelector('#notes-panel > div > div > div.toolbar.toolbar-default.toolbar-wrap.no-top-padding:not([data-markdown-editor="true"])');
        if (addAttachmentsWrapper) {
            addAttachmentsWrapper.dataset.markdownEditor = true;
            buttons.forEach(function (buttonInfo) {
                addAttachmentsWrapper.append(createButton(buttonInfo));
            });
        }
    }

    addStyle([
        '#notes-panel > div > div > div.toolbar.toolbar-default.toolbar-wrap.no-top-padding { flex-flow: row wrap; display: -webkit-box; }',
        '#notes-panel .notes-editor .notes-custom { width: 28px; height: 28px; margin-right: 0; padding: 5px; border: 1px solid transparent; border-radius: var(--radius); background-color: transparent; }',
        '#notes-panel .notes-editor .notes-custom:hover { background-color: var(--colorBgDark); }',
        '#notes-panel .notes-editor .notes-custom svg { width: 16px; height: auto; fill: var(--colorFg); }',
        '#notes-panel .notes-editor .notes-custom:hover svg { fill: var(--colorHighlightBg); }',
        '#notes-panel .notes-editor .notes-toggle-md[disabled] ~ .notes-custom { opacity: 0.5; pointer-events: none; }',
        '.NotesEditor-Toolbar button.active { background-color: var(--colorFgFadedMore); }',
    ].join(''));
    
    const observeDOM = (function () {
        return function (obj, callback) {
            const obs = new MutationObserver(function (mutations, observer) {
                if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
                    callback(mutations, observer);
                }
            });
            obs.observe(obj, {
                childList: true,
                subtree: true
            });
        };
    })();

    observeDOM(document, function (mutations, observer) {
        const panels = document.querySelector('#panels');
        if (panels) {
            observer.disconnect();
            markdownEditor();
            observeDOM(panels, function () {
                markdownEditor();
            });
        }
    });
})();
