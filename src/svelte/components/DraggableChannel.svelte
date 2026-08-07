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
        showGameInTooltip = false,
        /** Config entry whose channel is no longer followed: named, but dead. */
        unfollowed = false,
        /** 'row' (default) | 'grid' (avatar + name, viewer badge on the corner) | 'split' (avatar + name, viewer count below) | 'dock' (avatar only) */
        variant = 'row',
        /** Dock-only: red glow ring around a live avatar. */
        showLiveHalo = false
    } = $props();

    let profilePic = $derived(unfollowed ? UNFOLLOWED_CHANNEL_IMAGE : channelProfilePic);

    // In dock, no name is ever shown: the tooltip is the only place the
    // channel is identified, so it takes over the title slot.
    let tooltipContent = $derived({
        title: variant === 'dock' ? channelName : title,
        game: showGameInTooltip && isLive ? gameName : null
    });

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
    .card {
        border-radius: 4px;
        transition: background-color 0.15s ease;
    }
    .card.grid-cell {
        flex-direction: column;
        align-items: center;
        gap: 0.15em;
        text-align: center;
        padding: 0.4em 0.2em;
    }
    .split-viewers {
        display: flex;
        align-items: center;
        gap: 0.3em;
        font-size: 0.7em;
        line-height: 1;
        opacity: 0.85;
    }
    .split-viewers p {
        margin: 0;
        line-height: 1;
    }
    .grid-avatar {
        position: relative;
        width: 2.4em;
        height: 2.4em;
    }
    .grid-badge {
        position: absolute;
        top: -0.3em;
        right: -0.3em;
        background: #eb0400;
        color: #fff;
        font-size: 0.6em;
        font-weight: 700;
        line-height: 1;
        padding: 0.25em 0.35em;
        border-radius: 999px;
    }
    .grid-name {
        width: 100%;
        margin: 0;
        font-size: 0.72em;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .card.dock-cell {
        padding: 0.25em;
        flex: none;
    }
    .profile-picture.dock-avatar {
        width: 2.14em;
        height: 2.14em;
        flex-shrink: 0;
        transition: filter 0.12s ease;
    }
    .dock-avatar.live {
        box-shadow: 0 0 0 2px var(--content-color, transparent), 0 0 0 3.5px #eb0400;
    }
    .dock-avatar.offline {
        filter: grayscale(100%);
        opacity: 0.6;
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
        font-family: Roobert, Tajawal, Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    .channel-name p {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        -webkit-box-flex: 1 !important;
        flex-grow: 1 !important;
        line-height: 1.25;
    }
    .game-name {
        padding-inline-end: 4px !important;
        font-family: Roobert, Tajawal, Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    .game-name p {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        /* color: var(--color-text-alt-2) !important; */
        /* font-size: var(--font-size-4) !important; */
        text-align: -webkit-match-parent !important;
        line-height: 1.25 !important;
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
        object-fit: cover;
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
<a class="card" class:grid-cell={variant === 'grid' || variant === 'split'} class:dock-cell={variant === 'dock'} id="draggable-channel" class:unfollowed use:maybeTooltip={tooltipContent} href={ !blockNavigation && !unfollowed ? "https://www.twitch.tv/" + channelName : null } onclick={navigate}>
    {#if variant === 'dock'}
        <div class="profile-picture dock-avatar" class:live={isLive && showLiveHalo} class:offline={!isLive}>
            <img class={['profile-picture', greyIfOffline && 'greyIfOffline', !isLive && 'offline']} src={profilePic} alt="" />
        </div>
    {:else if variant === 'grid'}
        <div class="profile-picture grid-avatar">
            <img class={['profile-picture', greyIfOffline && 'greyIfOffline', !isLive && 'offline']} src={profilePic} alt="" />
            {#if isLive}<span class="grid-badge">{formatter.format(viewerCount)}</span>{/if}
        </div>
        <p class="grid-name">{channelName}</p>
    {:else if variant === 'split'}
        <div class="profile-picture grid-avatar">
            <img class={['profile-picture', greyIfOffline && 'greyIfOffline', !isLive && 'offline']} src={profilePic} alt="" />
        </div>
        <p class="grid-name">{channelName}</p>
        {#if isLive}
            <div class="split-viewers">
                <span class="live"></span>
                <p>{formatter.format(viewerCount)}</p>
            </div>
        {/if}
    {:else}
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
                    {#if isLive}
                        <div class="flex-viewer-count">
                            <div class="live"></div>
                            <p class="viewer-count">{formatter.format(viewerCount)}</p>
                        </div>
                    {:else if !unfollowed && showOffline }
                        <div class="offline">{$_('channel.offline')}</div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</a>



