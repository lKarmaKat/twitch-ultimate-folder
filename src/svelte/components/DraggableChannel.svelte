<script>
    import { maybeTooltip, tooltip } from "../tooltip.svelte";
    import { _ } from 'svelte-i18n';
    import { UNFOLLOWED_CHANNEL_IMAGE } from '../../constantes.js';

    let { channelId,
        channelName,
        channelProfilePic,
        viewerCount,
        gameName = null,
        isLive,
        title = '' ,
        color = '',
        blockNavigation = true,
        showOffline = false,
        greyIfOffline = false,
        /** Config entry whose channel is no longer followed: named, but dead. */
        unfollowed = false
    } = $props();

    let profilePic = $derived(unfollowed ? UNFOLLOWED_CHANNEL_IMAGE : channelProfilePic);

	function navigate(event) {
        event.preventDefault();
        if (unfollowed) return;
        if (!blockNavigation) {
            window.parent.postMessage({
                type: 'navigate',
				channel: channelName
            }, '*');
        } else {
            
        }
	}

    let formatter = Intl.NumberFormat('en', { notation: 'compact' });
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
        display: flex;
        -webkit-box-pack: justify !important;
        justify-content: space-between !important;
    }
    :host([collapsed]) .layout-flex {
        display: none;
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
        width: 2.15em;
        height: 2.15em;
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
    .profile-picture img.offline.greyIfOffline {
        filter: grayscale(100%);
    }
    a {
        position: relative;
        color: inherit;
        text-decoration: inherit;
        margin: 0px;
        padding: 0.357em 0.57em;
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
    /* :global(.nested-list) a {
        padding: 5px 0 !important;
    } */
    :host([collapsed]) * {
        padding: 0 !important;
        margin: 0 !important;
    }

    a .channel-name {
        font-weight: 600;
    }
    /* Entree de config sans chaine suivie derriere : lisible, mais visiblement
       inactive. Le curseur reste celui du drag, l'element se deplace encore. */
    a.unfollowed {
        cursor: grab;
    }
    a.unfollowed .channel-name p {
        text-decoration: line-through;
        opacity: 0.75;
    }
    .unfollowed-label {
        font-style: italic;
        opacity: 0.7;
    }
    .live {
        background-color: #eb0400;
        border-radius: 9000px;
        width: 0.6em;
        height: 0.6em;
        display: inline-block;
        position: relative;
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
<a class="card" id="draggable-channel" class:unfollowed use:maybeTooltip={title} href={ !blockNavigation && !unfollowed ? "https://www.twitch.tv/" + channelName : null } onclick={navigate}>
    <!-- <div class="layout-container" style="background-color: {color};"> -->
        <div class="flex-profile-picture">
            <div class="profile-picture">
                <img class={['profile-picture', greyIfOffline && 'greyIfOffline', !isLive && 'offline']} src={profilePic} alt="" />
            </div>
        </div>
        <div class="layout">
            <div class="layout-flex">
                <div class="title">
                    <div class="channel-name">
                        <p>{channelName}</p>
                    </div>
                    <div class="game-name">
                        {#if unfollowed}<p class="unfollowed-label">{$_('channel.unfollowed')}</p>
                        {:else if gameName && isLive}<p>{gameName}</p>{/if}
                    </div>
                </div>
                <div class="viewer-count-container">
                    {#if unfollowed}
                        <!-- ni live, ni offline : la chaine n'est plus suivie -->
                    {:else if isLive}
                        <div class="flex-viewer-count">
                            <div class="live"></div>
                            <!-- <p class="viewer-count">{viewerCount}</p> -->
                            <p class="viewer-count">{formatter.format(viewerCount)}</p>
                        </div>
                    {:else if showOffline }
                        <div class="offline">{$_('channel.offline')}</div>
                    {/if}
                </div>
            </div>
        </div>
    <!-- </div> -->
</a>



