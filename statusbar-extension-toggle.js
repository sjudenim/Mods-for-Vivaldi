function extStyle() {
	const style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = `
	#browser > div.toolbar.toolbar-droptarget.toolbar-statusbar.toolbar-medium > div.toolbar.toolbar-mainbar.toolbar-extensions.toolbar-large > div.button-narrow.button-toolbar svg path {
		d: path('M12 6v2h2V6zm0 6v2h2v-2zm0 6v2h2v-2z');
	}
`;};

setTimeout(function wait() {
	const extWrapper = document.querySelector('.toolbar.toolbar-mainbar.toolbar-extensions.toolbar-large');
	const statusBar = document.querySelector('.toolbar-statusbar');
	if (extWrapper != null) {
		statusBar.appendChild(extWrapper);
		extStyle();
	}
	else {
		setTimeout(wait, 800);
	}
}, 800);
