setTimeout(function wait() {
	const extWrapper = document.querySelector('.toolbar.toolbar-mainbar.toolbar-extensions.toolbar-large');
	const statusBar = document.querySelector('.toolbar-statusbar');
	if (extWrapper != null) {
		statusBar.appendChild(extWrapper);
	}
	else {
		setTimeout(wait, 300);
	}
}, 300);
