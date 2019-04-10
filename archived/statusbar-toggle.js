setTimeout(function wait() {
	let adr = document.querySelector(".toolbar-addressbar.toolbar");
	if (adr != null) {


// Tools-Menu

		let footer = document.getElementById('footer')
		let spanT = document.createElement('span');
		let divT = document.createElement('div');
		let btnT = document.createElement('button');
		let svgT = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		let pathT = document.createElementNS("http://www.w3.org/2000/svg", "path");
		let infstat = document.getElementById('status_info');
		let infdiv = document.createElement('div');
		let infbtn = document.createElement('button');
		let infsvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		let infpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
		
		spanT.id = 'toolsorder'; 
		divT.id = 'droptool';
		btnT.id = 'tools';
		btnT.classList.add('button-toolbar');
		btnT.setAttribute("tabindex", "-1");
		btnT.setAttribute("title", "Tools");
		svgT.setAttributeNS(null, "width", "26");
		svgT.setAttributeNS(null, "height", "26");
		svgT.setAttributeNS(null, "viewBox", "0 0 26 26");
		infdiv.id = 'divID';
		infbtn.id = 'toggle-links';
		infbtn.classList.add('button-toolbar-small');
		infbtn.setAttribute("tabindex", "-1");
		infbtn.setAttribute("title", "Show Status Info");
		infsvg.setAttributeNS(null, "width", "16");
		infsvg.setAttributeNS(null, "height", "16");
		infsvg.setAttributeNS(null, "viewBox", "0 0 26 26");
		
		adr.insertBefore(spanT,document.querySelector(".addressfield").nextSibling);
		spanT.appendChild(btnT);
		btnT.appendChild(svgT);
		svgT.appendChild(pathT);
		spanT.appendChild(divT);
		divT.appendChild(footer);
		footer.classList.add('disabled');
		footer.appendChild(infdiv);
		infdiv.appendChild(infbtn);
		infbtn.appendChild(infsvg);
		infsvg.appendChild(infpath);
		
        document.getElementById('tools').addEventListener('click', function() {
            if (footer.classList.contains('disabled')) {
                footer.classList.remove('disabled');
                btnT.classList.add('active');
            } else {
                footer.classList.add('disabled');
                btnT.classList.remove('active');
            }
        });
		
		document.getElementById('toggle-links').addEventListener('click', function () {
			if (footer.classList.contains('on')) {
				footer.classList.remove('on');
				infpath.style.fill = 'var(--colorFg)';
				infbtn.setAttribute("title", "Show Status Info");
				infbtn.classList.remove('active');
			}
			else {
				footer.classList.add('on');
				infpath.style.fill = 'var(--colorHighlightBg)';
				infbtn.setAttribute("title", "Hide Status Info");
				infbtn.classList.add('active');
			}
		});


	}
	else {
		setTimeout(wait, 300);
	}
}, 300);