<script>
  	import DraggableChannel from './DraggableChannel.svelte';
	import { maybeTooltip, tooltip } from "../tooltip";
    import * as CST from '../../constantes.js'
	import { writable } from 'svelte/store'
    import FolderIcon from './FolderIcon.svelte';
    import DotIcon from './DotIcon.svelte';
	
    let { listId = "rootList", channelConfig, channelRef }  = $props();
    // export let channelConfig;
    // export let channelRef;
    let behavior = $derived($channelConfig[listId]?.behavior);
    let style = $derived($channelConfig[listId]?.style);
	let type = $derived($channelConfig[listId]?.type);
	let barTypeColor = $derived.by(() => {
		let color = CST.BAR_TYPE.find(e => e.id === type.barType);
		if (!color || !color.color) {
			throw new Error("Display: bar color not found")
		}
		console.log("border color", color.color, listId)
		return color.color;
	});

	// console.log(`liste ${listId}`, $channelConfig)
	let extendedOnStartup=false;
	let extendOnHover=false;
	let extendOnClick=false;
	let isPinnable=false;

	let header = $state('');
	let content = $state('');

	let extended = $state(extendedOnStartup);

	channelConfig.subscribe(config => {
		// console.log("UPDATE DISPLAY")
		updateStyleVars(listId, config);
	});

	function updateStyleVars(listId, config) {
		if (config) {
			behavior = config[listId]?.behavior;
			style = config[listId]?.style;
			if (behavior) {
				if (extendedOnStartup !== $channelConfig[listId].behavior.extendedOnStartup)
					extended = $channelConfig[listId].behavior.extendedOnStartup;
				extendedOnStartup = $channelConfig[listId].behavior.extendedOnStartup;
				extendOnHover = $channelConfig[listId].behavior.extendOnHover;
				extendOnClick = $channelConfig[listId].behavior.extendOnClick;
				isPinnable = $channelConfig[listId].behavior.isPinnable;
			}
			
			if (style && style.theme === CST.CUSTOM_STYLE) {
				header = style.header;
				content = style.content;
			} else {
				header = '';
				content = '';
			}
		}
		
	}
	updateStyleVars(listId, $channelConfig[listId]);

	function getNode(item) {
		return $channelRef.find(e => e.channel_id === item.channel_id);
	}

	function getNodeIfLive(item) {
	 	// counter = document.querySelectorAll(".channel-overlay.li" + listId ).length;
		return $channelRef.find(e => {
			// console.log("checking liveness for " + e.channel_name + " " + e.isLive)
			return e.channel_id === item.channel_id && e.isLive
		});
	}
    function toggleAutoCollapse(e) {
        console.log("display", $channelConfig[listId]);
		extended = !extended;
		// getSetAllChannelsInConfig();
        e.stopPropagation();
    }

	function getSetAllChannelsInConfig() {
		let set = new Set();
		let c = (listItem) => {
			for (let currentItem of listItem) {
				if (currentItem.channel_id) {
					set.add(currentItem.channel_id)
				} else if (currentItem.type === CST.TYPE_LIST && $channelConfig[currentItem.id]?.items?.length) {
					c($channelConfig[currentItem.id].items);
				}
			}
		}
		c($channelConfig.rootList.items);
		return set;
	}

	let counter = $derived.by(() => {
		let set = getSetAllChannelsInConfig();
		let count = 0;
		for (let ch of $channelRef) {
			if (!set.has(ch.channel_id) && ch.isLive) {
				count++;
			}
		}
		return count;
	});

	function getAllOtherChannels(ref, item) {
		let set = getSetAllChannelsInConfig();
		let list = [];
		let c = 0;
		for (let ch of ref) {
			if (!set.has(ch.channel_id)) {
				if (ch.isLive)
					c++;
				list.push(ch);
			}
		}
		const alphaSortCallback = (a, b) => {
			if (a.isLive && b.isLive) {
				let an = a.channel_name;
				let bn = b.channel_name;
				return ('' + an).localeCompare(bn)
			} else if (a.isLive) {
				return -1;
			} else if (b.isLive) {
				return 1;
			} else {
				let an = a.channel_name;
				let bn = b.channel_name;
				return ('' + an).localeCompare(bn)
			}
		};
		const viewerCountSortCallback = (a,b) => {
			if (a.isLive && b.isLive) {
				return b.viewer_count - a.viewer_count
			} else if (a.isLive) {
				return -1;
			} else if (b.isLive) {
				return 1;
			} else {
				let an = a.channel_name;
				let bn = b.channel_name;
				return ('' + an).localeCompare(bn)
			}
		};
		if (item.sort === CST.ALPHA_SORT)
			list.sort(alphaSortCallback);
		else 
			list.sort(viewerCountSortCallback);
		// console.log("all others", list.length, list)
		// counter = c;
		return list;
	}


	let hasLiveChannelCallback = (listId) => {
		let liveChannels = new Set();
		let otherListWithOnlineChannel = false
		let allOtherChannels = false;
		if ($channelConfig[listId] && $channelConfig[listId].items) {
			for (let ch of $channelConfig[listId].items) {
				if (ch.id === CST.ALL_OTHER_CHANNELS) {
					allOtherChannels = true;
				} else if (ch.type === CST.TYPE_LIST) {
					otherListWithOnlineChannel = hasLiveChannelCallback(ch.id)
				} else {
					let liveChannel = getNodeIfLive(ch);
					if (liveChannel) {
						liveChannels.add(ch);
					}
				}
			}
			// counter = liveChannels.size;
		}
		return liveChannels.size > 0 || otherListWithOnlineChannel || allOtherChannels;
	}

	let liveChannels = $derived.by(() => {
		return hasLiveChannelCallback(listId)
	})

</script>
	<!-- <div class="width-test">

	</div> -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	 {#if liveChannels}
	<div class="list-container">
		{#if listId !== 'rootList'}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="list-header" style="background-color:{header.headerColor}; --theme-color:{barTypeColor}" class:border={barTypeColor} on:click={toggleAutoCollapse}>
			<div class="left">
				<div class="flex-row">
					<span class="icon-container">
						{#if type.iconType === 1}
							<FolderIcon />
						{:else if type.iconType === 2}	
							<DotIcon />
						{/if}
					</span>
					<p class="list-title">{$channelConfig[listId]?.name}</p>
					<div class='list-icon'  use:maybeTooltip={$channelConfig[listId]?.name}>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
							<rect x="6" y="4" width="11" height="2" rx="1"/>
							<rect x="6" y="9" width="11" height="2" rx="1"/>
							<rect x="6" y="14" width="11" height="2" rx="1"/>
							<circle cx="3" cy="5" r="1.5"/>
							<circle cx="3" cy="10" r="1.5"/>
							<circle cx="3" cy="15" r="1.5"/>
						</svg>
					</div>

				</div>

			</div>
			<div class="right">
				<p>
					<!-- {counter} -->
				</p>
			</div>
		</div>
		{/if}
		{#if $channelConfig[listId]?.hasOwnProperty("items")}
			<div class="list-body" class:extended style="background-color: {content.contentColor};">
				<div>
					{#each $channelConfig[listId].items as item(item.id)}
						{#if item.type === CST.TYPE_LIST}
							<div class="nested-list">
								<svelte:self  bind:channelConfig={channelConfig} listId={item.id} bind:channelRef={channelRef}></svelte:self>
							</div>
						{:else if item.id === CST.ALL_OTHER_CHANNELS}

							{#each getAllOtherChannels($channelRef, item) as other(`${other.channel_id}`)}
								{@const i = getNode(other)}
								<div class="channel-overlay li{listId}">
									<DraggableChannel 
									blockNavigation={false}
									channelId={i?.channel_id} 
									channelName={i?.channel_name} 
									channelProfilePic={i?.profile_image_url} 
									viewerCount={i?.viewer_count}
									gameName={i?.game_name}
									isLive={i?.isLive}
									idbidon={i?.idbidon}
									title={i?.title}/>
								</div>
							{/each}
						{:else if item.channel_id}
							{@const i = getNodeIfLive(item)}
							{#if i}
							<div class="channel-overlay li{listId}">
									<DraggableChannel 
									blockNavigation={false}
									channelId={i?.channel_id} 
									channelName={i?.channel_name} 
									channelProfilePic={i?.profile_image_url} 
									viewerCount={i?.viewer_count}
									gameName={i?.game_name}
									isLive={i?.isLive}
									title={i?.title}/>
								</div>
							{/if}
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>
	{/if}
			
<style>
	.icon-container {
		width: 1.5em;
		height: 1.5em;
		margin-right: .28em;
		margin-left: 0.2em;
	}
	.icon-container,
	.flex-row {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;

	}
	/* :global(.al-right) > .list-container {
		margin-left: 0em !important;
	} */
	:global(.al-right  .list-container  .list-container .list-container) {
		margin-left: 0.5em;
	}
	/* :global(.al-left) > .list-container {
		margin-right: 0em !important;
	} */
	:global(.al-left  .list-container  .list-container .list-container) {
		margin-right: 0.5em;
	}
	:global(.al-left .list-container .list-container .channel-overlay) {
		margin-right: 0.9em
	}
	:global(.al-right .list-container .list-container .channel-overlay) {
		margin-left: 0.9em
	}
    :host([collapsed]) * {
        padding: 0 !important;
        margin: 0 !important;
    }
	:host([collapsed]) .list-icon {
		display: block
	}
	.list-icon {
		display: none;
	}
	:host([collapsed]) .list-title {
		display: none;
	}
	div.width-test {
		border: 1px solid red;
		width: 24rem;
		box-sizing: border-box;
	}
	div {
		/* width: 100%; */
		/* padding: 0.3em;
		margin: 0.15em 0; */
		padding: 0.0em;
		margin: 0em 0;
	}
	.list-side-menu {
		visibility: visible;
		opacity: 0;
		transition: opacity 0.2s linear;
		size: 2em;
		margin: 0;
		padding: 0;
		max-height: 100%;
		width: fit-content;
	}
	.list-header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 0.4em 0 0.4em 0.4em;
		/* position: relative; */
		/* background-color: rgb(119, 56, 119); */
		/* width: 100%; */
		/* margin: 0; */
		/* padding: 0; */
		/* padding: 0.6em 0.3em 0 0.5em; */
		user-select: none;
		/* border-radius: 7%; */
	}
	.list-header.border {
		border-left: 3px solid var(--theme-color);
	}
	.right {
		width: auto;
		padding-right: 4px;
	}
	.list-container {
		/* padding: 0 0 0 .1em; */
		/* border: 1px solid rgba(128, 128, 128, 0.295); */
	}
	.nested-list {
		/* padding: 0.3em 0 0.3em 0.3em; */
	}
	.delete {
		border: 1px solid rgba(216, 57, 57, 0.685);
		color: white;
		background-color: rgba(216, 57, 57, 0.685);
	}
	.list-body {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows .5s ease;
		margin: 0;
		padding: 0;
	}
	.list-body div {
		overflow: hidden;
	}
	.list-header:hover ~ .list-body,
	.list-header ~ .list-body:hover,
	.list-body.extended,
	.list-container > .list-body:first-child {
		grid-template-rows: 1fr;
	}
	.channel-overlay {
		cursor: pointer;
	}
</style>



