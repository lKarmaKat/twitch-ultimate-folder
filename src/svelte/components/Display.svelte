<script>
  	import DraggableChannel from './DraggableChannel.svelte';
	import { maybeTooltip, tooltip } from "../tooltip.svelte";
    import * as CST from '../../constantes.js'
	import { writable } from 'svelte/store'
	import { _ } from 'svelte-i18n';
	import Self from './Display.svelte'
    import IconPicker from './icons/IconPicker.svelte';
    import ChevronIcon from './icons/ChevronIcon.svelte';
    import { ICON_NONE, ICON_ANGLE, ICON_CROSS } from './icons/index';
    import SortIndicatorIcon from './icons/SortIndicatorIcon.svelte';
    import CounterType from './CounterType.svelte';
	import { hasVisibleContent } from '../listVisibility.js';
	import { openFlyout, scheduleCloseFlyout } from '../event.svelte.js';

    let {
		listId = "rootList",
		configManager,
		/** Set by an exclusive parent: the id of the only child allowed open. */
		exclusiveOpenId = null,
		onExclusiveToggle = null,
		/** Rendered by a tabList/splitList parent: own header is skipped, body is always shown. */
		headless = false,
		/** Rendered as a splitList column: overrides this list's own layout for the body only. */
		forceVariant = null
	} = $props();

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

	// A small header has no icon slot, but the stored iconType is kept so that
	// switching back to medium restores the icon.
	let smallHeader = $derived(type?.height === CST.HEADER_HEIGHT_SMALL);
	let headerIconType = $derived(smallHeader ? ICON_NONE : type?.iconType);

	// Angle and cross already rotate on --icon-open: adding a chevron next to
	// them would show two open indicators for the same list.
	let chevronEnabled = $derived(
		(type?.[CST.TYPE_CHEVRON] ?? false)
		&& headerIconType !== ICON_ANGLE
		&& headerIconType !== ICON_CROSS
	);
	let exclusive = $derived(type?.[CST.TYPE_EXCLUSIVE] ?? false);
	let layout = $derived(type?.layout ?? CST.LIST_LAYOUT_STACK);
	let columns = $derived(type?.columns || 2);
	let maxItems = $derived(type?.maxItems ?? 0);
	let effectiveVariant = $derived(forceVariant ?? (
		layout === CST.LIST_LAYOUT_GRID ? 'grid' :
		layout === CST.LIST_LAYOUT_DOCK ? 'dock' : 'row'
	));
	// A split column is a narrow list rendered with grid-style cells.
	let cellVariant = $derived(effectiveVariant === 'split' ? 'grid' : effectiveVariant);

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

	let ruledByParent = $derived(typeof onExclusiveToggle === 'function');
	let extended = $derived(ruledByParent ? exclusiveOpenId === listId : openState);
	// A headless list has no header to click, and a tab panel has the tab row
	// instead: both always show their body.
	let effectiveExtended = $derived(headless || layout === CST.LIST_LAYOUT_TABS ? true : extended);

	let openChildId = $state(null);
	$effect(() => {
		configManager.selectedConfig;
		if (!exclusive) {
			openChildId = null;
			return;
		}
		const first = configManager.selectedConfig[listId]?.items?.find(i =>
			i.type === CST.TYPE_LIST
			&& configManager.selectedConfig[i.id]?.behavior?.[CST.EXTENDED_ON_STARTUP]);
		openChildId = first ? first.id : null;
	});

	function toggleExclusiveChild(childId) {
		openChildId = openChildId === childId ? null : childId;
	}

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
		if (ruledByParent) onExclusiveToggle(listId);
		else openState = !openState;
    }

	// flyoutList opens on hover instead of click: the body renders in a
	// separate panel positioned off this header's own rect (see FlyoutPopup.svelte).
	function onFlyoutEnter(e) {
		if (layout !== CST.LIST_LAYOUT_FLYOUT) return;
		openFlyout(listId, e.currentTarget.getBoundingClientRect());
	}
	function onFlyoutLeave() {
		if (layout !== CST.LIST_LAYOUT_FLYOUT) return;
		scheduleCloseFlyout(listId);
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

	function getChannelsInConfigFor(id) {
		let set = new Set();
		let currentList = configManager.selectedConfig[id];
		if (currentList?.items?.length) {
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

	// Shared by this list's own header badge and, when this list acts as a
	// splitList/tabList parent, each child's mini-caption / tab pip.
	function countsFor(id) {
		let set = getChannelsInConfigFor(id);
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
	}

	let channelsCounters = $derived(countsFor(listId));

	let liveChannelsCounter = $derived(channelsCounters.live);
	let totalChannelsCount = $derived(channelsCounters.total);

	let childListIds = $derived(
		(configManager.selectedConfig[listId]?.items ?? [])
			.filter(i => i.type === CST.TYPE_LIST)
			.map(i => i.id)
	);

	let activeChildId = $state(null);
	$effect(() => {
		configManager.selectedConfig;
		if (!childListIds.includes(activeChildId)) activeChildId = childListIds[0] ?? null;
	});

	function selectTab(e, id) {
		e.stopPropagation();
		activeChildId = id;
	}

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

	let customSort = $derived((configManager.selectedConfig[listId]?.sort ?? CST.CUSTOM_SORT) === CST.CUSTOM_SORT);

	function hasContentAfter(list, index) {
		for (let i = index + 1; i < list.length; i++) {
			const item = list[i];
			if (item.type === CST.TYPE_SEPARATOR) return false;
			if (item.type === CST.TYPE_LIST) {
				if (hasVisibleContent(configManager, item.id)) return true;
			} else if (item.channel_id < 0 || configManager.getLiveChannel(item.channel_id)) {
				return true;
			}
		}
		return false;
	}

	// Any sort but the custom one scatters the items a separator was placed between.
	let renderedItems = $derived.by(() => {
		const list = getListChannelsSortedByStrategy(configManager.selectedConfig[listId].items);
		return list.filter((item, index) =>
			item.type !== CST.TYPE_SEPARATOR || (customSort && hasContentAfter(list, index)));
	});

	// overflowList: only the first `maxItems` entries render, folded back
	// behind a "+N" row until clicked open. Session state, like otherLiveSort.
	let foldExpanded = $state(false);
	$effect(() => {
		configManager.selectedConfig;
		foldExpanded = false;
	});
	let overflowCount = $derived(maxItems > 0 && !foldExpanded ? Math.max(0, renderedItems.length - maxItems) : 0);
	let visibleItems = $derived(overflowCount > 0 ? renderedItems.slice(0, maxItems) : renderedItems);
	function expandFold(e) {
		e.stopPropagation();
		foldExpanded = true;
	}

</script>
	<!-- <div class="width-test">

	</div> -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	 {#if visible}
	<div id="display-component" class="list-container" class:hover-enabled={hoverEnabled} class:tinted={barTypeColor} style={barTypeColor ? `--theme-color:${barTypeColor}` : ''}>
		{#if listId !== 'rootList' && !headless}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="list-header" style="--header-color:{header?.headerColor};" class:border={barTypeColor} class:pill={pillHeader} class:small={smallHeader} class:clickable={clickEnabled && layout !== CST.LIST_LAYOUT_TABS && layout !== CST.LIST_LAYOUT_FLYOUT} onclick={(layout === CST.LIST_LAYOUT_TABS || layout === CST.LIST_LAYOUT_FLYOUT) ? null : toggleAutoCollapse} onmouseenter={onFlyoutEnter} onmouseleave={onFlyoutLeave}>
			{#if layout === CST.LIST_LAYOUT_TABS}
				<div class="tab-row">
					{#each childListIds as childId (childId)}
						{@const childType = configManager.selectedConfig[childId]?.type}
						{@const counts = countsFor(childId)}
						<button type="button" class="tab" class:active={activeChildId === childId} onclick={(e) => selectTab(e, childId)}>
							<IconPicker iconType={childType?.iconType ?? ICON_NONE} />
							{#if counts.live > 0}<span class="tab-pip">{counts.live}</span>{/if}
						</button>
					{/each}
					<span class="tab-total">{liveChannelsCounter}/{totalChannelsCount}</span>
				</div>
			{:else}
				<div class="left">
					<div class="flex-row">
						{#if chevronEnabled}
							<span class="header-chevron" class:extended>
								<ChevronIcon />
							</span>
						{/if}
						<span class="display-icon-container" class:extended class:no-icon={headerIconType === ICON_NONE}>
							<IconPicker iconType={headerIconType} />
						</span>
						{#if layout !== CST.LIST_LAYOUT_SPLIT}
							<p class="list-title">{configManager.selectedConfig[listId]?.name}</p>
						{/if}
					</div>
				</div>
				<div class="right">
					<CounterType counter={liveChannelsCounter} totalChannels={totalChannelsCount} viewerCountType={type.viewerCountType} />
				</div>
			{/if}
		</div>
		{/if}
		{#if configManager.selectedConfig[listId]?.hasOwnProperty("items") && (layout !== CST.LIST_LAYOUT_FLYOUT || headless)}
			{#if layout === CST.LIST_LAYOUT_TABS}
				<div class="list-body tabs-body" class:extended={effectiveExtended} style="--content-color:{content?.contentColor};">
					<div>
						{#if activeChildId}
							<div class="nested-list">
								<Self listId={activeChildId} configManager={configManager} headless={true} />
							</div>
						{/if}
					</div>
				</div>
			{:else if layout === CST.LIST_LAYOUT_SPLIT}
				<div class="list-body split-body" class:extended={effectiveExtended} class:rail={indentRail} style="--content-color:{content?.contentColor};">
					<div>
						<div class="split-columns" style="--split-columns:{columns};">
							{#each childListIds as childId (childId)}
								{@const childType = configManager.selectedConfig[childId]?.type}
								{@const counts = countsFor(childId)}
								<div class="split-col">
									<div class="split-col-cap">
										<span class="split-col-icon"><IconPicker iconType={childType?.iconType ?? ICON_NONE} /></span>
										<span class="split-col-count">{counts.live}</span>
									</div>
									<Self listId={childId} configManager={configManager} headless={true} forceVariant="split" />
								</div>
							{/each}
						</div>
						{@render itemsList(renderedItems.filter(i => i.type !== CST.TYPE_LIST), false)}
					</div>
				</div>
			{:else}
				<div class="list-body" class:extended={effectiveExtended} class:rail={indentRail} class:grid-body={effectiveVariant === 'grid'} class:dock-body={effectiveVariant === 'dock'} class:split-col-body={effectiveVariant === 'split'} style="--content-color:{content?.contentColor}; --grid-columns:{columns};">
					<div>
						{@render itemsList(visibleItems, true)}
					</div>
				</div>
			{/if}
		{/if}
	</div>
	{/if}

{#snippet renderItem(item)}
	{#if item.type === CST.TYPE_LIST}
		<div class="nested-list">
			<Self
				listId={item.id}
				configManager={configManager}
				exclusiveOpenId={exclusive ? openChildId : null}
				onExclusiveToggle={exclusive ? toggleExclusiveChild : null} />
		</div>
	{:else if item.type === CST.TYPE_SEPARATOR}
		<div class="list-separator">
			{#if item.name}<span class="separator-label">{item.name}</span>{/if}
			<span class="separator-line"></span>
		</div>
	{:else if item.channel_id < 0 }
		{#if item.type === CST.ALL_OTHER_HEADER_SORTABLE}
			{@const otherSmall = item.height === CST.HEADER_HEIGHT_SMALL}
			{@const otherIconType = otherSmall ? ICON_NONE : (item.iconType ?? ICON_NONE)}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="list-header all-other-header clickable" class:small={otherSmall} onclick={toggleOtherSort}>
				<span class="display-icon-container extended" class:no-icon={otherIconType === ICON_NONE}>
					<IconPicker iconType={otherIconType} />
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
				title={i?.title}
				showGameInTooltip={true}
				showOffline={true}
				greyIfOffline={true}
				variant={cellVariant}/>
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
				title={i?.title}
				showGameInTooltip={true}
				showOffline={true}
				greyIfOffline={true}
				variant={cellVariant}/>
			</div>
		{/if}
	{/if}
{/snippet}

{#snippet itemsList(items, withFold)}
	{#each items as item(item.id)}
		{@render renderItem(item)}
	{/each}
	{#if withFold && overflowCount > 0}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="list-overflow-more" onclick={expandFold}>
			{$_('display.overflowMore', { values: { count: overflowCount } })}
		</div>
	{/if}
{/snippet}
			
<style>
	.display-icon-container {
		width: 1.5em;
		height: 1.5em;
		margin-right: .28em;
		margin-left: 0.2em;
		--icon-open: 0;
	}
	/* Open state as rendered, consumed by AngleIcon / CrossIcon: click state
	   (.extended) or hover expansion — mirrors the .list-body rules below. */
	.display-icon-container.extended,
	.list-container.hover-enabled:has(> .list-header:hover) > .list-header .display-icon-container,
	.list-container.hover-enabled:has(> .list-body:hover) > .list-header .display-icon-container {
		--icon-open: 1;
	}
	/* ICON_NONE: no icon slot, just a small inset so the title is not flush
	   against the header edge (ICON_EMPTY_PLACEHOLDER keeps the full slot). */
	.display-icon-container.no-icon {
		width: 0;
		margin-right: 0;
		margin-left: 0.4em;
	}
	.display-icon-container,
	.header-chevron,
	.flex-row {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;

	}
	/* Not mirrored on .al-left: only the margins and the rail switch sides
	   there, the header keeps its children in the same order. */
	.header-chevron {
		width: 0.9em;
		height: 0.9em;
		flex: none;
		margin-left: 0.3em;
		transform: rotate(calc(var(--icon-open, 0) * 90deg));
		transition: transform 300ms ease;
	}
	.header-chevron.extended,
	.list-container.hover-enabled:has(> .list-header:hover) > .list-header .header-chevron,
	.list-container.hover-enabled:has(> .list-body:hover) > .list-header .header-chevron {
		--icon-open: 1;
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
	/* Everything inside the header is sized in em (paddings, icon slot, badge),
	   so scaling the font shrinks the whole row coherently. */
	.list-header.small {
		padding: 0.1em 0 0.1em 0;
		font-size: 0.85em;
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
	.list-separator {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 0.7em 0.25em 0.7em;
		user-select: none;
	}
	:global(.al-left) .list-separator {
		flex-direction: row-reverse;
	}
	.separator-label {
		flex: none;
		font-size: 0.72em;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.separator-line {
		flex: 1 1 auto;
		height: 1px;
		border-radius: 1px;
		background: var(--theme-color, currentColor);
		opacity: 0.45;
	}

	/* ---- tabList ---- */
	.tab-row {
		display: flex;
		align-items: center;
		gap: 0.2em;
		flex: 1 1 auto;
		min-width: 0;
	}
	.tab {
		position: relative;
		flex: none;
		width: 2em;
		height: 1.8em;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		border-radius: 4px;
		cursor: pointer;
		color: inherit;
	}
	.tab.active {
		box-shadow: inset 0 -2px 0 0 var(--theme-color, currentColor);
	}
	.tab-pip {
		position: absolute;
		top: 0.1em;
		right: 0.1em;
		min-width: 1em;
		font-size: 0.6em;
		font-weight: 700;
		line-height: 1.4;
		padding: 0 0.3em;
		border-radius: 999px;
		background: var(--theme-color, currentColor);
		color: #fff;
	}
	.tab-total {
		margin-left: auto;
		flex: none;
		font-size: 0.75em;
		opacity: 0.7;
		padding-right: 0.4em;
	}

	/* ---- splitList ---- */
	.split-columns {
		display: flex;
		align-items: stretch;
	}
	.split-col {
		flex: 1 1 0;
		min-width: 0;
	}
	.split-col:not(:first-child) {
		border-left: 1px solid var(--theme-color, currentColor);
		opacity: 1;
	}
	.split-col-cap {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3em;
		padding: 0.3em 0;
		font-size: 0.75em;
	}
	.split-col-icon {
		display: flex;
		width: 1em;
		height: 1em;
	}
	.split-col-count {
		font-weight: 700;
	}

	/* ---- gridList ---- */
	.grid-body > div {
		display: grid;
		grid-template-columns: repeat(var(--grid-columns, 4), 1fr);
		gap: 0.4em;
		padding: 0.3em;
	}

	/* ---- dockList ---- */
	.dock-body > div {
		display: flex;
		flex-direction: row;
		gap: 0.5em;
		padding: 0.3em 0.5em;
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: thin;
		scrollbar-color: var(--theme-color, currentColor) transparent;
	}
	.dock-body > div::-webkit-scrollbar {
		height: 4px;
	}
	.dock-body > div::-webkit-scrollbar-thumb {
		background: var(--theme-color, currentColor);
		border-radius: 2px;
	}

	/* ---- overflowList ---- */
	.list-overflow-more {
		padding: 0.4em 0.7em;
		font-size: 0.8em;
		opacity: 0.7;
		cursor: pointer;
		user-select: none;
	}
	.list-overflow-more:hover {
		opacity: 1;
	}
</style>



