/** Accepts a plain title, or {title, game} to add the category on a second line. */
function normalize(params) {
	if (typeof params === 'string') return { title: params, game: null };
	return { title: params?.title ?? null, game: params?.game ?? null };
}

function hasContent(params) {
	const { title, game } = normalize(params);
	return !!(title || game);
}

export function tooltip(node, params) {
    let tt = document.querySelector("#custom-tooltip");
    if (tt)
	    tt.classList.add('tooltip');

	let current = params;
	let child = null;

	// textContent, never innerHTML: a stream title is arbitrary API text and
	// this node lives on Twitch's document, outside the shadow root.
	function build() {
		const wrapper = document.createElement('span');
		wrapper.setAttribute('id', 'tooltip');
		const { title, game } = normalize(current);
		if (title) {
			const line = document.createElement('span');
			line.className = 'tt-title';
			line.textContent = title;
			wrapper.appendChild(line);
		}
		if (game) {
			const line = document.createElement('span');
			line.className = 'tt-game';
			line.textContent = game;
			wrapper.appendChild(line);
		}
		return wrapper;
	}

	function handleFocus() {
		// An offline channel has no title yet: return before the listener swap
		// below, or a later hover would never fire again.
		if (!hasContent(current)) return;

		child = build();
        let c = tt.querySelector('.content');
		c.appendChild(child);
        let {x, y, height, width} = node.getBoundingClientRect();
        let pos = tt.querySelector('.pos');
        let y2 = child.getBoundingClientRect();
		// #tooltip carries translate(-100%): the offset below is its RIGHT edge,
		// so x alone puts the title left of the row, x + width + its own width right of it.
		// The row always sits flush against one screen edge, so whichever side has
		// less room is the wrong one — no fixed preference to fall back on.
		const showRight = x < window.innerWidth/2 ;
		// const roomRight = window.innerWidth - (x + width);
		if (showRight) {
			pos.style.transform = "translate(" + (x + width + y2.width) +"px, " + (y + height/2 - y2.height/2) + "px)";
		} else {
			pos.style.transform = "translate(" + x +"px, " + (y + height/2 - y2.height/2) + "px)";
		}
        tt.setAttribute('tabindex', 0);

		node.addEventListener('mouseleave', handleBlur)
		node.addEventListener('blur', handleBlur)
		node.removeEventListener('mouseenter', handleFocus)
		node.removeEventListener('focus', handleFocus)
	}

	function handleBlur() {
		if (child && child.parentNode) {
			child.parentNode.removeChild(child);
		}
		child = null;

		node.removeEventListener('mouseleave', handleBlur)
		node.removeEventListener('blur', handleBlur)
		node.addEventListener('mouseenter', handleFocus)
		node.addEventListener('focus', handleFocus)
	}

	node.addEventListener('mouseenter', handleFocus)
	node.addEventListener('focus', handleFocus)

	return {
		// The poller rewrites titles and categories every few seconds.
		update(newParams) {
			current = newParams;
			if (!child) return;
			if (!hasContent(current)) { handleBlur(); return; }
			const next = build();
			child.parentNode.replaceChild(next, child);
			child = next;
		},
		destroy() {
			handleBlur();
			node.removeEventListener('mouseenter', handleFocus)
			node.removeEventListener('focus', handleFocus)
		}
	}
};
