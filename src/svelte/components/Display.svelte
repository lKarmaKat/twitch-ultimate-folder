<script>
  	import DraggableChannel from './DraggableChannel.svelte';
	import { maybeTooltip, tooltip } from "../tooltip.svelte";
    import * as CST from '../../constantes.js'
	import { writable } from 'svelte/store'
	import Self from './Display.svelte'
    import IconPicker from './icons/IconPicker.svelte';
    import CounterType from './CounterType.svelte';

    let { listId = "rootList", configManager }  = $props();
	
    let behavior;
    // let behavior = $derived(configManager.selectedConfig[listId]?.behavior);
    let style;
	let type = $derived.by(() => {
		return configManager.selectedConfig[listId]?.type
	});
	let barTypeColor = $derived.by(() => {
		let color = CST.BAR_TYPE.find(e => e.id === type.barType);
		if (!color || !color.color) {
			return 0;
		}
		return color.color;
	});

	// console.log(`liste ${listId}`, $channelConfig)
	let extendedOnStartup=false;
	let extendOnHover=false;
	let extendOnClick=false;
	let isPinnable=false;

	let header = $derived.by(() => {
		return configManager.selectedConfig[listId]?.style.header;
	});
	let content = $derived.by(() => {
		return configManager.selectedConfig[listId]?.style.content;
	});

	let extended = $derived.by(() => {
		return configManager.selectedConfig[listId].behavior[CST.EXTENDED_ON_STARTUP] || false;
	});

	let displayList = $derived.by(() => {
		let channelsId = configManager.selectedConfig[listId].items.filter(e => e.channel_id);
		let s = [];
		channelsId.forEach(ch => {
			let c = configManager.getLiveChannel(ch)
			if (c) {
				s.push(c)
			}
		})
		return s;
	})

	function getNode(item) {
		return configManager.getChannel(item.channel_id)
	}

	function getNodeIfLive(item) {
		return configManager.getLiveChannel(item.channel_id);
	}

    function toggleAutoCollapse(e) {
        console.log("display", configManager.selectedConfig[listId]);
		extended = !extended;
        e.stopPropagation();
    }

	function getSetAllChannelsInConfig() {
		let set = new Set();
		let c = (listItem) => {
			for (let currentItem of listItem) {
				if (currentItem.channel_id) {
					set.add(currentItem.channel_id)
				} else if (currentItem.type === CST.TYPE_LIST && configManager.selectedConfig[currentItem.id]?.items?.length) {
					c(configManager.selectedConfig[currentItem.id].items);
				}
			}
		}
		c(configManager.selectedConfig.rootList.items);
		return set;
	}

	function getChannelsInConfig() {
		let set = new Set();
		let currentList = configManager.selectedConfig[listId];
		if (currentList.items?.length) {
			for (let currentItem of currentList.items) {
				if (currentItem.channel_id) {
					set.add(currentItem.channel_id)
				}
			}
		}
		return set;
	}

	function hasAllOtherChannels(set) {
		for (let current of set) {
			if (current === CST.ALL_OTHER_CHANNELS) {
				return true;
			}
		}
		return false;
	}

	let counter = $derived.by(() => {
		let set = getChannelsInConfig();
		let containsAllOtherChannels = hasAllOtherChannels(set);
		if (containsAllOtherChannels) {
			let item = CST.ALL_OTHER_CHANNELS_ELEMENT;
			let s = getAllOtherChannels(configManager.channelsPickRef, item);
			set = new Set();
			s.forEach(e => set.add(e.channel_id));
		}
		let count = 0;
		set.forEach(e => {
			let channel = configManager.getLiveChannel(e);
			if (channel) {
				count++;
			}
		})
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
		// let allOtherChannelsRef = configManager.getChannel(item.channel_id)
		let allOtherChannelsRef = configManager.getAllOtherChannel()
		if (allOtherChannelsRef.sort === CST.ALPHA_SORT) {
			list.sort(alphaSortCallback);
		} else  {
			list.sort(viewerCountSortCallback);
		}
		return list;
	}


	let hasLiveChannelCallback = (listId) => {
		let liveChannels = new Set();
		let otherListWithOnlineChannel = false
		let allOtherChannels = false;
		if (configManager.selectedConfig[listId] && configManager.selectedConfig[listId].items) {
			for (let ch of configManager.selectedConfig[listId].items) {
				// if (ch.id === CST.ALL_OTHER_CHANNELS) {
				if (ch.channel_id < 0) {
					return true;
				} else if (ch.type === CST.TYPE_LIST) {
					if (hasLiveChannelCallback(ch.id))
					return true;
				} else {
					if (getNodeIfLive(ch)) {
						return true;
					}
				}
			}
			// counter = liveChannels.size;
		}
		return false;
	}

	let liveChannels = $derived.by(() => {
		return hasLiveChannelCallback(listId)
	})

	function getListChannelsSortedByStrategy(channelsList) {
		let sortedList = [...channelsList];
		const alphaSortCallback = (ax, bx) => {
			if (ax.type === CST.TYPE_LIST) return 1;
			if (bx.type === CST.TYPE_LIST) return -1;
			let a = getNodeIfLive(ax);
			let b = getNodeIfLive(bx);
			// console.log('sorting', a, ax, b, bx)
			if (!a) return 1;
			if (!b) return -1;
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
		const viewerCountSortCallback = (ax,bx) => {
			if (ax.type === CST.TYPE_LIST) return 1;
			if (bx.type === CST.TYPE_LIST) return -1;
			let a = getNodeIfLive(ax);
			let b = getNodeIfLive(bx);
			// console.log('sorting', a, ax, b, bx)
			if (!a) return 1;
			if (!b) return -1;
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
		// console.log("sortStrategy for", listId, configManager.selectedConfig[listId].sort)
		if (configManager.selectedConfig[listId].sort === CST.ALPHA_SORT) {
			// console.log("alpha for", listId)
			sortedList.sort(alphaSortCallback);
		}
		else if (configManager.selectedConfig[listId].sort === CST.VIEWER_SORT) {
			// console.log("viwer for", listId)
			
			sortedList.sort(viewerCountSortCallback);
		}
		return sortedList;
	}

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
		<div class="list-header" style="--header-color:{header?.headerColor};--theme-color:{barTypeColor}" class:border={barTypeColor} onclick={toggleAutoCollapse}>
			<div class="left">
				<div class="flex-row">
					<span class="display-icon-container" class:extended>
						<IconPicker iconType={type.iconType} />
					</span>
					<!-- <span class="display-icon-container title" class:extended use:maybeTooltip={configManager.selectedConfig[listId]?.name}>
						<IconPicker iconType={type.iconType} />
					</span> -->
					<p class="list-title">{configManager.selectedConfig[listId]?.name}</p>
				</div>

			</div>
			<div class="right">
				<CounterType counter={counter} viewerCountType={type.viewerCountType} />
			</div>
		</div>
		{/if}
		{#if configManager.selectedConfig[listId]?.hasOwnProperty("items")}
			<div class="list-body" class:extended style="--content-color:{content?.contentColor};">
				<div>
					<!-- {#each configManager.selectedConfig[listId].items as item(item.id)} -->
					{#each getListChannelsSortedByStrategy(configManager.selectedConfig[listId].items) as item(item.id)}
						{#if item.type === CST.TYPE_LIST}
							<div class="nested-list">
								<Self  listId={item.id} configManager={configManager} />
							</div>
						<!-- {:else if item.channel_id === CST.ALL_OTHER_CHANNELS} -->
						{:else if item.channel_id < 0 }
							{#each getAllOtherChannels(configManager.channelsPickRef, item) as other(`${other.channel_id}`)}
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
	.display-icon-container {
		width: 1.5em;
		height: 1.5em;
		margin-right: .28em;
		margin-left: 0.2em;
	}
	.display-icon-container,
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
		margin-right: 0.6em
	}
	:global(.al-right .list-container .list-container .channel-overlay) {
		margin-left: 0.6em
	}
    :host([collapsed]) * {
        padding: 0 !important;
        margin: 0 !important;
    }
	.right {
		display: block;
	}

	:host(:not([collapsed])) .display-icon-container.title,
	:host([collapsed]) span.display-icon-container:not(.title),
	:host([collapsed]) .right {
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
		padding: 0.4em 0 0.4em 0.0em;
		background-color: var(--header-color); /* not currently used*/
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
		background-color: var(--content-color);
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



