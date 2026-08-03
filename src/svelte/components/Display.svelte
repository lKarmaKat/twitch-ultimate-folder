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
	import { getSmartMatchedChannels } from '../smartList.js';
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
	let listStyle = $derived.by(() => {
		return configManager.selectedConfig[listId]?.style
	});
	let themeColor = $derived.by(() => {
		let color = CST.THEME_COLOR.find(e => e.id === listStyle?.theme);
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
	);
	let exclusive = $derived(type?.[CST.TYPE_EXCLUSIVE] ?? false);
	let layout = $derived(type?.layout ?? CST.LIST_LAYOUT_STACK);
	let columns = $derived(type?.columns || 2);
	let maxItems = $derived(type?.maxItems ?? 0);
	let effectiveVariant = $derived(forceVariant ?? (
		layout === CST.LIST_LAYOUT_GRID ? 'grid' :
		layout === CST.LIST_LAYOUT_DOCK ? 'dock' : 'row'
	));
	// Own headless setting applies to dockList and the classic row stack;
	// other layouts manage their header visibility differently.
	let effectiveHeadless = $derived(headless || ([CST.LIST_LAYOUT_DOCK, CST.LIST_LAYOUT_STACK].includes(layout) && (type?.[CST.TYPE_HEADLESS] ?? false)));

	let source = $derived(configManager.selectedConfig[listId]?.source ?? { kind: CST.SOURCE_KIND_MANUAL });
	let isSmartList = $derived(source.kind !== CST.SOURCE_KIND_MANUAL);

	let smartMatchedItems = $derived.by(() => {
		if (!isSmartList) return [];
		return getSmartMatchedChannels(configManager, listId).map(ch => ({ id: ch.channel_id, channel_id: ch.channel_id }));
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
	let hasBar = $derived(header?.[CST.STYLE_HAS_BAR] ?? false);

	// Session state: reset to the startup value whenever the config is reloaded
	// (save / reset / init) or the startup checkbox is edited live in the popup.
	let openState = $state(false);
	$effect(() => {
		configManager.selectedConfig;
		openState = startupExtended;
	});
	// Disabling "extends on click" while a click-opened list is expanded must
	// not leave it stuck open with no way to collapse it.
	$effect(() => {
		if (!clickEnabled && openState && !startupExtended) {
			openState = false;
		}
	});

	let ruledByParent = $derived(typeof onExclusiveToggle === 'function');
	let extended = $derived(ruledByParent ? exclusiveOpenId === listId : openState);
	// A headless list has no header to click, and a tab panel has the tab row
	// instead: both always show their body.
	let effectiveExtended = $derived(effectiveHeadless || layout === CST.LIST_LAYOUT_TABS ? true : extended);

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
		const rule = configManager.selectedConfig[id]?.source;
		if (rule && rule.kind !== CST.SOURCE_KIND_MANUAL) {
			const matched = getSmartMatchedChannels(configManager, id);
			return { live: matched.filter(ch => ch.isLive).length, total: matched.length };
		}
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

	let channelsCounters = $derived.by(() => {
		if (layout === CST.LIST_LAYOUT_SPLIT || layout === CST.LIST_LAYOUT_TABS) {
			return childListIds.reduce((acc, id) => {
				const c = countsFor(id);
				return { live: acc.live + c.live, total: acc.total + c.total };
			}, { live: 0, total: 0 });
		}
		return countsFor(listId);
	});
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
		if (effectiveSort === CST.ALPHA_SORT) {
			sortedList.sort(alphaSortCallback);
		}
		else if (effectiveSort === CST.VIEWER_SORT) {
			sortedList.sort(viewerCountSortCallback);
		}
		return sortedList;
	}

	let customSort = $derived((configManager.selectedConfig[listId]?.sort ?? CST.CUSTOM_SORT) === CST.CUSTOM_SORT);
	// A smartList's content isn't draggable, so custom sort has no order to fall
	// back to: default it to viewer count even if a stale config still has it.
	let effectiveSort = $derived(
		isSmartList && customSort ? CST.VIEWER_SORT : configManager.selectedConfig[listId]?.sort
	);

	// Manual items are cleared on switching kind, but nested sub-lists remain:
	// they render alongside the rule matches, which never touch `items`.
	let baseItems = $derived(
		isSmartList
			? [...smartMatchedItems, ...configManager.selectedConfig[listId].items.filter(i => i.type === CST.TYPE_LIST)]
			: configManager.selectedConfig[listId].items
	);

	// Any sort but the custom one scatters the items a separator was placed between.
	let renderedItems = $derived.by(() => {
		const list = getListChannelsSortedByStrategy(baseItems);
		return list.filter(item => item.type !== CST.TYPE_SEPARATOR || customSort);
	});

	// overflowList: only the first `maxItems` entries render, folded back
	// behind a "+N" row until clicked open. Session state, like otherLiveSort.
	let foldExpanded = $state(false);
	$effect(() => {
		configManager.selectedConfig;
		foldExpanded = false;
	});
	function willRenderItem(item) {
		if (item.type === CST.TYPE_LIST) return hasVisibleContent(configManager, item.id);
		if (item.type === CST.TYPE_SEPARATOR) return true;
		if (item.channel_id < 0) return true;
		return !!configManager.getLiveChannel(item.channel_id);
	}
	let renderableCount = $derived(renderedItems.filter(willRenderItem).length);
	let overflowCount = $derived(maxItems > 0 && !foldExpanded ? Math.max(0, renderableCount - maxItems) : 0);
	let visibleItems = $derived.by(() => {
		if (overflowCount <= 0) return renderedItems;
		let count = 0;
		for (let idx = 0; idx < renderedItems.length; idx++) {
			if (willRenderItem(renderedItems[idx])) {
				count++;
				if (count >= maxItems) return renderedItems.slice(0, idx + 1);
			}
		}
		return renderedItems;
	});
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
	<div id="display-component" class="list-container" class:hover-enabled={hoverEnabled} class:tinted={themeColor} style={themeColor ? `--theme-color:${themeColor}` : ''}>
		{#if listId !== 'rootList' && !effectiveHeadless}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="list-header" style="--header-color:{header?.headerColor};" class:border={hasBar} class:pill={pillHeader} class:small={smallHeader} class:clickable={clickEnabled && layout !== CST.LIST_LAYOUT_TABS && layout !== CST.LIST_LAYOUT_FLYOUT} onclick={(layout === CST.LIST_LAYOUT_TABS || layout === CST.LIST_LAYOUT_FLYOUT) ? null : toggleAutoCollapse} onmouseenter={onFlyoutEnter} onmouseleave={onFlyoutLeave}>
			{#if layout === CST.LIST_LAYOUT_TABS}
				<div class="tab-row">
					{#each childListIds as childId (childId)}
						{@const childType = configManager.selectedConfig[childId]?.type}
						{@const childIconType = childType?.iconType ?? ICON_NONE}
						{@const counts = countsFor(childId)}
						<button type="button" class="tab" class:active={activeChildId === childId} onclick={(e) => selectTab(e, childId)}>
							{#if childIconType === ICON_NONE}
								<span class="tab-fallback">{(configManager.selectedConfig[childId]?.name ?? '').charAt(0).toUpperCase()}</span>
							{:else}
								<IconPicker iconType={childIconType} />
							{/if}
							{#if counts.live > 0}<span class="tab-pip">{counts.live}</span>{/if}
						</button>
					{/each}
					<span class="tab-total">
						<CounterType counter={liveChannelsCounter} totalChannels={totalChannelsCount} viewerCountType={type.viewerCountType} />
					</span>
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
						<p class="list-title">{configManager.selectedConfig[listId]?.name}</p>
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
							<div class="tab-panel">
								<Self listId={activeChildId} configManager={configManager} headless={true} />
							</div>
						{/if}
					</div>
				</div>
			{:else if layout === CST.LIST_LAYOUT_SPLIT}
				<div class="list-body split-body" class:extended={effectiveExtended} class:rail={indentRail} style="--content-color:{content?.contentColor};">
					<div>
						<div class="split-columns">
							{#each childListIds as childId (childId)}
								{@const childType = configManager.selectedConfig[childId]?.type}
								{@const counts = countsFor(childId)}
								<div class="split-col">
									<div class="split-col-cap">
										<span class="split-col-icon" class:no-icon={(childType?.iconType ?? ICON_NONE) === ICON_NONE}><IconPicker iconType={childType?.iconType ?? ICON_NONE} /></span>
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
					<div
						onwheel={effectiveVariant === 'dock' ? (e) => {
							if (e.deltaY === 0) return;
							e.currentTarget.scrollLeft += e.deltaY;
							e.preventDefault();
						} : undefined}
					>
						{#if effectiveVariant === 'grid'}
							<div class="grid-items">
								{@render itemsList(visibleItems, true)}
							</div>
						{:else}
							{@render itemsList(visibleItems, true)}
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	</div>
	{/if}

{#snippet renderItem(item)}
	{#if item.type === CST.TYPE_LIST}
		<div class="nested-list" class:headless-parent={effectiveHeadless}>
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
				showGameInTooltip={effectiveVariant !== 'row'}
				showOffline={true}
				greyIfOffline={true}
				variant={effectiveVariant}/>
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
				showGameInTooltip={effectiveVariant !== 'row'}
				showOffline={true}
				greyIfOffline={true}
				variant={effectiveVariant}/>
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
		width: 1.4em;
		height: 1.4em;
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
	/* A split column isn't a nested tree node, it's a side-by-side column:
	   exclude it from the depth-based indent above regardless of how deep
	   the splitList itself sits in the tree. */
	:global(.al-right) .split-col > .list-container {
		margin-left: 0;
	}
	:global(.al-left) .split-col > .list-container {
		margin-right: 0;
	}
	/* A tab panel isn't a nested tree node either: it's the same content the
	   headless tab list would show inline if it had its own header. */
	:global(.al-right) .tab-panel > .list-container {
		margin-left: 0;
	}
	:global(.al-left) .tab-panel > .list-container {
		margin-right: 0;
	}
	/* A headless list has no header row of its own either: its children
	   shouldn't be indented for a level that isn't visually there. */
	:global(.al-right) .headless-parent > .list-container {
		margin-left: 0;
	}
	:global(.al-left) .headless-parent > .list-container {
		margin-right: 0;
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
		position: relative;
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
		/* border-bottom: 1px solid var(--header-separator, transparent); */
		user-select: none;
		/* border-radius: 7%; */
	}
	.list-header::after {
		content: "";
		border: 1px solid var(--header-separator, transparent);
		width: 90%;
		position: absolute;
		bottom: 0%;
		left: 5%;
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
	/* The gutter is kept without a theme color so the checkbox still indents the
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
		left: 0.10em;
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
		/* Rows get this inset from the icon slot collapsing (.no-icon); tabs have
		   no per-list icon to condition on, so it's hardcoded here instead. */
		margin-left: 0.4em;
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
		color: var(--bar-accent);
	}
	.tab.active::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 2px;
		background: var(--bar-accent);
	}
	/* ICON_NONE fallback: unlike a row's title, a tab has no text of its own,
	   so an empty tab is indistinguishable from its neighbours without this. */
	.tab-fallback {
		font-size: 0.85em;
		font-weight: 700;
		line-height: 1;
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
		background: var(--bar-accent);
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
		border-left: 1px solid var(--header-separator, transparent);
		opacity: 1;
	}
	.split-col-cap {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3em;
		padding: 0.3em 0;
		font-size: 0.75em;
		/* border-bottom: 1px solid var(--header-separator, transparent); */
		position: relative;
	}
	.split-col-cap::after {
		content: "";
		border: 1px solid var(--header-separator, transparent);
		width: 60%;
		position: absolute;
		bottom: 0%;
		left: 20%;
	}
	.split-col-icon {
		display: flex;
		width: 1.5em;
		height: 1.5em;
	}
	.split-col-icon.no-icon {
		width: 0;
	}
	.split-col-count {
		font-weight: 700;
	}

	/* ---- gridList ---- */
	.grid-items {
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
		scroll-behavior: smooth;
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar-color, currentColor) transparent;
	}
	.dock-body > div > .channel-overlay {
		flex-shrink: 0;
	}
	.dock-body > div::-webkit-scrollbar {
		height: 4px;
	}
	.dock-body > div::-webkit-scrollbar-thumb {
		background: var(--scrollbar-color, currentColor);
		border-radius: 2px;
	}
	.dock-body > div::-webkit-scrollbar-thumb:hover {
		background: var(--scrollbar-color-hover, currentColor);
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



