setTimeout(function wait() {
	let wrapper = document.querySelector(".toolbar-addressbar.toolbar > .extensions-wrapper");
	let footer = document.getElementById('footer');
	if (wrapper != null) {
		footer.appendChild(wrapper);
	}
	else {
		setTimeout(wait, 300);
	}
}, 300);