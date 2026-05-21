import PortConnector from './portConnector.svelte.js';
import { alignmentLeft } from './event.js';

export function maybeTooltip(node, title) {
    if (!title) return;
    return tooltip(node, title);
  }
export function tooltip(node, params) {
    let tt = document.querySelector("#custom-tooltip");
	let alignedLeft = true;
	alignmentLeft.subscribe((newAlignment) => {
		alignedLeft = newAlignment
	});
	// let alignmentCb = (data) => {
    // 	alignedLeft = data.data
  	// }
	// let port = new PortConnector(alignmentCb, "alignment", "tooltip from svelte component")
    if (tt)
	    tt.classList.add('tooltip');
    
	function handleFocus() {
        
        //     function callback(entries, observer) {
        //         for (const entry of entries) {
        //             console.log(entry);
        //         }
        //     }
        // const resizeObserver = new ResizeObserver(callback);
        // resizeObserver.observe(node);
		const child = document.createElement('span');
		child.textContent = params;
		child.setAttribute('id', 'tooltip');
        let c = tt.querySelector('.content');
		c.appendChild(child);
        let {x, y, height, width} = node.getBoundingClientRect();
        let pos = tt.querySelector('.pos');
        let y2 = child.getBoundingClientRect();
		if (alignedLeft) {
			pos.style.transform = "translate(" + (x + width + y2.width) +"px, " + (y + height/2 - y2.height/2) + "px)";
		} else {
			pos.style.transform = "translate(" + x +"px, " + (y + height/2 - y2.height/2) + "px)";
		}
        // console.log(pos, "translate(" + x +"px, " + (y + height/2 - y2/2) + "px)")
        tt.setAttribute('tabindex', 0);
		
		node.addEventListener('mouseleave', handleBlur)
		node.addEventListener('blur', handleBlur)
		node.removeEventListener('mouseenter', handleFocus)
		node.removeEventListener('focus', handleFocus)
	}

	function handleBlur() {
        let c = tt.querySelector('.content');
		c.removeChild(c.querySelector('#tooltip'));
		
		node.removeEventListener('mouseleave', handleBlur)
		node.removeEventListener('blur', handleBlur)
		node.addEventListener('mouseenter', handleFocus)
		node.addEventListener('focus', handleFocus)
	}
	
	node.addEventListener('mouseenter', handleFocus)
	node.addEventListener('focus', handleFocus)
	
	return {
		onDestroy() {
            let c = tt.querySelector('.content');
			tt.classList.remove('tooltip');
			c.removeEventListener('mouseenter', handleFocus)
			c.removeEventListener('focus', handleFocus)
		}
	}
};