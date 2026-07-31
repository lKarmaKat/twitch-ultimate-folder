<script>
  	import DraggableChannel from './DraggableChannel.svelte';
	import { maybeTooltip, tooltip } from "../tooltip.svelte";
    import * as CST from '../../constantes.js'
	import { writable } from 'svelte/store'
	import { _ } from 'svelte-i18n';
	import Self from './Display.svelte'
    import IconPicker from './icons/IconPicker.svelte';
    import { ICON_NONE } from './icons/index';
    import SortIndicatorIcon from './icons/SortIndicatorIcon.svelte';
    import CounterType from './CounterType.svelte';
	import { hasVisibleContent } from '../listVisibility.js';

    let { listId = "rootList", configManager }  = $props();
	
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

	let behavior = $derived(configManager.selectedConfig[listId]?.behavior ?? {});
	let startupExtended = $derived(behavior[CST.EXTENDED_ON_STARTUP] ?? false);
	let hoverEnabled = $derived(behavior[CST.EXTENDEDS_ON_HOVER] ?? false);
	let clickEnabled = $derived(behavior[CST.EXTENDEDS_ON_CLICK] ?? false);

	let header = $derived.by(() => {
		return configManager.selectedConfig[listId]?.style.header;
	});
	let content = $derived.by(() => {
		return configManager.selectedConfig[listId]?.style.content;
	});

	let pillHeader = $derived(header?.[CST.STYLE_PILL_HEADER] ?? false);
	let indentRail = $derived(content?.[CST.STYLE_INDENT_RAIL] ?? false);

	// Session state: reset to the startup value whenever the config is reloaded
	// (save / reset / init) or the startup checkbox is edited live in the popup.
	let openState = $state(false);
	$effect(() => {
		configManager.selectedConfig;
		openState = startupExtended;
	});

	let extended = $derived(openState);

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
        e.stopPropagation();
        if (!clickEnabled) return;
		openState = !openState;
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

	let channelsCounters = $derived.by(() => {
		let set = getChannelsInConfig();
		if (hasAllOtherChannels(set)) {
			let item = CST.ALL_OTHER_CHANNELS_ELEMENT;
			let s = getAllOtherChannels(configManager.channelsPickRef, item);
			set = new Set();
			s.forEach(e => set.add(e.channel_id));
		}
		let live = 0;
		let total = 0;
		set.forEach(e => {
			// Une chaine unfollow reste dans la config mais ne s'affiche jamais :
			// la compter gonflerait le total pour rien.
			if (e < 0 || configManager.getChannel(e)) total++;
			if (configManager.getLiveChannel(e)) live++;
		});
		return { live, total };
	});

	let liveChannelsCounter = $derived(channelsCounters.live);
	let totalChannelsCount = $derived(channelsCounters.total);

	// "Live" sort of the all-others block: session state, seeded from the stored
	// `sort`. Clicking the header changes it without touching the saved config.
	let otherLiveSort = $state();
	$effect(() => {
		configManager.selectedConfig;
		const it = configManager.selectedConfig[listId]?.items?.find(i => i.channel_id === CST.ALL_OTHER_CHANNELS);
		otherLiveSort = it?.sort;
	});

	function toggleOtherSort(e) {
		e.stopPropagation();
		otherLiveSort = otherLiveSort === CST.ALPHA_SORT ? CST.VIEWER_SORT : CST.ALPHA_SORT;
	}

	function getAllOtherChannels(ref, item, sortOverride) {
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
		const sortVal = sortOverride ?? item?.sort;
		if (sortVal === undefined || sortVal === CST.VIEWER_SORT) {
			list.sort(viewerCountSortCallback);
		} else  {
			list.sort(alphaSortCallback);
		}
		return list;
	}


	let visible = $derived(hasVisibleContent(configManager, listId));

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
	 {#if visible}
	<div id="display-component" class="list-container" class:hover-enabled={hoverEnabled} style={barTypeColor ? `--theme-color:${barTypeColor}` : ''}>
		{#if listId !== 'rootList'}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="list-header" style="--header-color:{header?.headerColor};" class:border={barTypeColor} class:pill={pillHeader} class:clickable={clickEnabled} onclick={toggleAutoCollapse}>
			<div class="left">
				<div class="flex-row">
					<span class="display-icon-container" class:extended class:no-icon={type.iconType === ICON_NONE}>
						<IconPicker iconType={type.iconType} />
					</span>
					<!-- <span class="display-icon-container title" class:extended use:maybeTooltip={configManager.selectedConfig[listId]?.name}>
						<IconPicker iconType={type.iconType} />
					</span> -->
					<p class="list-title">{configManager.selectedConfig[listId]?.name}</p>
				</div>

			</div>
			<div class="right">
				<CounterType counter={liveChannelsCounter} totalChannels={totalChannelsCount} viewerCountType={type.viewerCountType} />
			</div>
		</div>
		{/if}
		{#if configManager.selectedConfig[listId]?.hasOwnProperty("items")}
			<div class="list-body" class:extended class:rail={indentRail} style="--content-color:{content?.contentColor};">
				<div>
					<!-- {#each configManager.selectedConfig[listId].items as item(item.id)} -->
					{#each getListChannelsSortedByStrategy(configManager.selectedConfig[listId].items) as item(item.id)}
						{#if item.type === CST.TYPE_LIST}
							<div class="nested-list">
								<Self  listId={item.id} configManager={configManager} />
							</div>
						<!-- {:else if item.channel_id === CST.ALL_OTHER_CHANNELS} -->
						{:else if item.channel_id < 0 }
							{#if item.type === CST.ALL_OTHER_HEADER_SORTABLE}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div class="list-header all-other-header clickable" onclick={toggleOtherSort}>
									<span class="display-icon-container" class:no-icon={(item.iconType ?? ICON_NONE) === ICON_NONE}>
										<IconPicker iconType={item.iconType ?? ICON_NONE} />
									</span>
									<p class="list-title">{$_('display.allOtherChannels')}</p>
									<span class="all-other-sort-icon"><SortIndicatorIcon sort={otherLiveSort} /></span>
								</div>
							{/if}
							{#each getAllOtherChannels(configManager.channelsPickRef, item, otherLiveSort) as other(`${other.channel_id}`)}
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
	/* ICON_NONE: no icon slot, just a small inset so the title is not flush
	   against the header edge (ICON_EMPTY_PLACEHOLDER keeps the full slot). */
	.display-icon-container.no-icon {
		width: 0;
		margin-right: 0;
		margin-left: 0.4em;
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
	/* Side mirrored like the nested list margins above */
	:global(.al-right) .list-header.border {
		border-left: 3px solid var(--theme-color);
	}
	:global(.al-left) .list-header.border {
		border-right: 3px solid var(--theme-color);
	}
	.list-header.pill {
		border-radius: 6px;
		transition: background-color 0.15s ease;
	}
	/* inset shadow instead of a border: it follows the rounded corners */
	:global(.al-right) .list-header.pill.border {
		border-left: none;
		box-shadow: inset 3px 0 0 var(--theme-color);
	}
	:global(.al-left) .list-header.pill.border {
		border-right: none;
		box-shadow: inset -3px 0 0 var(--theme-color);
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
	/* The gutter is kept without a barType so the checkbox still indents the
	   list, the rail itself just stays invisible. */
	.list-body.rail {
		position: relative;
	}
	.list-body.rail::before {
		content: '';
		position: absolute;
		top: 2px;
		bottom: 2px;
		width: 2px;
		border-radius: 2px;
		background: var(--theme-color, transparent);
	}
	/* Side mirrored like the nested list margins above */
	:global(.al-right .list-body.rail) {
		padding-left: 0.75em;
	}
	:global(.al-right .list-body.rail::before) {
		left: 0.25em;
	}
	:global(.al-left .list-body.rail) {
		padding-right: 0.75em;
	}
	:global(.al-left .list-body.rail::before) {
		right: 0.25em;
	}
	/* Direct child combinator: Display is recursive, so every nesting level shares
	   the same scope class — a descendant selector would leak the parent's hover
	   setting onto children that have it disabled. */
	.list-container.hover-enabled > .list-header:hover ~ .list-body,
	.list-container.hover-enabled > .list-header ~ .list-body:hover,
	.list-body.extended,
	.list-container > .list-body:first-child {
		grid-template-rows: 1fr;
	}
	.list-header.clickable {
		cursor: pointer;
	}
	/* "All others" block header: background and text inherited from .list-header
	   via dark_channel.css; svg colour from .icon-container. */
	.all-other-header {
		padding: 0.4em 0 0.4em 0;
		justify-content: flex-start;
		user-select: none;
	}
	.all-other-header .list-title {
		padding: 0;
	}
	.all-other-sort-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.2em;
		height: 1.2em;
		margin-left: auto;
		margin-right: 0.4em;
	}
	.channel-overlay {
		cursor: pointer;
	}
</style>



