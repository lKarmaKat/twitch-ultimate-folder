<script>
	export let channelId;
	export let channelName;
	export let channelProfilePic;
    export let viewerCount;
    export let gameName = null;
    export let isLive;
    export let title='';
    export let color='';
    export let tick=false;
    export let blockNavigation = true;
    export let idbidon = 0;

	function navigate(event) {
        event.preventDefault();
        if (!blockNavigation) {
            console.log("sent");
            window.parent.postMessage({
                type: 'navigate',
				channel: channelName
            }, '*');
        }
	}

    let formatter = Intl.NumberFormat('en', { notation: 'compact' });

  function maybeTooltip(node, title) {
    if (!title) return;
    return tooltip(node, title);
  }










function tooltip(node, params) {
    let tt = document.querySelector("#custom-tooltip");
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
        let {x, y, height} = node.getBoundingClientRect();
        let pos = tt.querySelector('.pos');
        // console.log(x, y, height);
        let y2 = child.getBoundingClientRect().height;
        pos.style.transform = "translate(" + x +"px, " + (y + height/2 - y2/2) + "px)";
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
}
</script>

<style>
    * {
        box-sizing: border-box;
    }
    .card,
    .layout-container {
        max-width: 100%;
    }
    .layout-container {
        width: 100%;
        position: relative;
        display: flex;
        flex-direction: row;
        max-height: 30px;
        margin-left: .3em;
    }
    .layout {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        margin-inline-start: 8px !important;
        width: 100% !important;
    }
    .layout-flex {
        display: flex !important;
        -webkit-box-pack: justify !important;
        justify-content: space-between !important;
    }
    .title {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        width: 100% !important;
    }
    .channel-name {
        display: flex !important;
        -webkit-box-align: center !important;
        align-items: center !important;
    }
    .channel-name p {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        -webkit-box-flex: 1 !important;
        flex-grow: 1 !important;
    }
    .game-name {
        padding-inline-end: 4px !important;
    }
    .game-name p {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        /* color: var(--color-text-alt-2) !important; */
        /* font-size: var(--font-size-4) !important; */
        text-align: -webkit-match-parent !important;
        line-height: var(--line-height-body) !important;
    }
    .viewer-count-container {
        flex-shrink: 0 !important;
        margin-inline-start: 4px !important;
        position: relative;
    }
    .flex-viewer-count {
        display: flex !important;
        -webkit-box-align: center !important;
        align-items: center !important;
    }
    .title {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        width: 100% !important;
    }
    .flex-profile-picture {
        flex-shrink: 0 !important;
        -webkit-box-align: center !important;
        align-items: center !important;
    }
    .flex-viewer-count p {
        margin-left: 4px;
    }
    .profile-picture {
        position: relative;
        width: 2.5em;
        height: 2.5em;
        max-height: 100%;
    }
    .profile-picture img {
        display: block;
        width: 100%;
        height: 100%;
        max-width: 100%;
        border-radius: 9000px;
        border: none;
        /* vertical-align: top; */
    }
    .profile-picture img.offline {
        filter: grayscale(100%);
    }
    a {
        position: relative;
        color: inherit;
        text-decoration: inherit;
        margin: 0px;
        padding: 5px 8px;
        border: 0px;
        font: inherit;
        vertical-align: baseline;
        text-decoration: none;
        height: fit-content;
        display: flex !important;
        -webkit-box-align: center !important;
        align-items: center !important;
        flex-wrap: nowrap !important;
        /* width: 100% !important; */
    }

    a .channel-name {
        font-weight: 600;
    }
    .live {
        background-color: #eb0400;
        border-radius: 9000px;
        width: 0.6em;
        height: 0.6em;
        display: inline-block;
        position: relative;
    }

    :global(.tooltip) {
		white-space: nowrap;
		position: relative;
		padding-top: 0.35rem;
		border-bottom: 1px solid currentColor;
	}
	
	:global(#tooltip) {
		position: absolute;
		top: 0%;
		/* right: 0.78rem; */
        left: 0;
		transform: translate(-100%, 0);
		padding: 0.2rem 0.35rem;
		background: hsl(0, 0%, 20%);
		color: hsl(0, 0%, 98%);
		font-size: 0.95em;
		border-radius: 0.25rem;
		filter: drop-shadow(0 1px 2px hsla(0, 0%, 0%, 0.2));
		width: max-content;
	}
/* 	
	:global(.tooltip:not(:focus) #tooltip::before) {
		content: '';
		position: absolute;
		top: 50%;
		right: -0%;
		transform: translate(100%, -50%);
		width: 0.6em;
		height: 0.25em;
		background: inherit;
		clip-path: polygon(0 0, 0 100%, 100% 50%);
        border: 1px solid red;
	} */
</style>
		<!-- content: '';
		position: absolute;
		top: 50%;
		right: -0%;
		transform: translate(100%, -50%);
		width: 1em;
		height: 1em;
		background: inherit;
		/* clip-path: polygon(0% 0%, 100% 0%, 50% 100%); */
		clip-path: polygon(0 0, 0 100%, 100% 50%); -->
<a class="card" id="cd" use:maybeTooltip={title} href={ !blockNavigation ? "https://www.twitch.tv/" + channelName : null } on:click={navigate}>
    <!-- <div class="layout-container" style="background-color: {color};"> -->
        <div class="flex-profile-picture">
            <div class="profile-picture">
                <img class="profile-picture" class:offline={!isLive} src={channelProfilePic} alt="" />
            </div>
        </div>
        <div class="layout">
            <div class="layout-flex">
                <div class="title">
                    <div class="channel-name">
                        <p>{channelName}</p>
                    </div>
                    <div class="game-name">
                        {#if gameName}<p>{gameName}</p>{/if}
                    </div>
                </div>
                <div class="viewer-count-containerviewer-count">
                    {#if isLive}
                        <div class="flex-viewer-count">
                            <div class="live"></div>
                            <!-- <p>{viewerCount}</p> -->
                            <p class="viewer-count">{formatter.format(viewerCount)}</p>
                        </div>
                    {:else}
                        <div class="offline">Offline</div>
                    {/if}
                </div>
            </div>
        </div>
    <!-- </div> -->
</a>



