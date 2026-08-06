<script>
  	import DraggableChannel from './DraggableChannel.svelte'
	import { parentFinalizeEvent, configChangeEvent, allOthersChannelSelectedEvent } from "../event.svelte.js";
  	import * as CST from '../../constantes.js'
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
	import { _ } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import Self from './ConfigList.svelte'
    import CogBtn from './CogBtn.svelte';
    import LayoutStackIcon from './icons/LayoutStackIcon.svelte';
    import LayoutSplitIcon from './icons/LayoutSplitIcon.svelte';
    import LayoutFlyoutIcon from './icons/LayoutFlyoutIcon.svelte';
    import LayoutTabsIcon from './icons/LayoutTabsIcon.svelte';
    import LayoutGridIcon from './icons/LayoutGridIcon.svelte';
    import LayoutDockIcon from './icons/LayoutDockIcon.svelte';




	let { configManager, listId, requestDeleteToParent, addRootNode = $bindable(), addRootSeparator = $bindable() } = $props()

	// type.layout is missing on configs saved before layouts existed: falls back to STACK, same as the renderer.
	const LAYOUT_ICONS = {
		[CST.LIST_LAYOUT_STACK]: LayoutStackIcon,
		[CST.LIST_LAYOUT_SPLIT]: LayoutSplitIcon,
		[CST.LIST_LAYOUT_FLYOUT]: LayoutFlyoutIcon,
		[CST.LIST_LAYOUT_TABS]: LayoutTabsIcon,
		[CST.LIST_LAYOUT_GRID]: LayoutGridIcon,
		[CST.LIST_LAYOUT_DOCK]: LayoutDockIcon,
	};
	let LayoutIcon = $derived(LAYOUT_ICONS[configManager.selectedConfig[listId]?.type?.layout ?? CST.LIST_LAYOUT_STACK] ?? LayoutStackIcon);

	// Rule-driven content: dropping a channel here would just be discarded on
	// the next kind change, so the zone refuses drops from other lists.
	let isSmartList = $derived((configManager.selectedConfig[listId]?.source?.kind ?? CST.SOURCE_KIND_MANUAL) !== CST.SOURCE_KIND_MANUAL);

	let showEmptyHint = $derived(listId === 'rootList' && (configManager.selectedConfig[listId]?.items?.length ?? 0) === 0);


	// let duplicatedElementError = $derived(!)
	let duplicatedElementError = $state(false)
	$effect(() => {
		duplicatedElementError = !parentFinalizeEvent.current;
	})

	const flipDurationMs = 80;
	function handleDndConsider(e) {
		const newItems = e.detail.items;
		configManager.selectedConfig[listId].items = newItems;
		duplicatedElementError = itemAlreadyInList(e);
	}

	function itemAlreadyInList(e) {
		let map = new Map();
		e.detail.items.forEach(i => {
			if (i.type !== CST.TYPE_LIST && i.type !== CST.TYPE_SEPARATOR)
				map.set(i.channel_id, true);
		});
		return e.detail.items.filter(i => i.type !== CST.TYPE_LIST && i.type !== CST.TYPE_SEPARATOR).length !== map.size;
	}

	function handleDndFinalize(e) {
		duplicatedElementError = false;
		let id = e.detail.info.id;
		const newItems = itemAlreadyInList(e) ? e.detail.items.filter(i => i.id !== id) : e.detail.items;
		configManager.selectedConfig[listId].items = newItems;
	}

	function transformDraggedElement(draggedEl, draggedData, draggedIndex) {
		if (duplicatedElementError) {
			if (!draggedData.save) {
				draggedData.save = draggedEl.innerHTML;
			}
			draggedEl.innerHTML = `<strong>${get(_)('configList.alreadyInList')}</strong>`;
			draggedEl.style.cursor = 'not-allowed';
		} else if (draggedData.save) {
			draggedEl.innerHTML = draggedData.save;
			draggedEl.style.cursor = 'grab';

		} else if (draggedData.type === CST.TYPE_LIST) {
			let chName = configManager.selectedConfig[draggedData.id];
			draggedEl.innerHTML = `<strong>${chName.name}</strong>`;
			// draggedEl.style.width = '200px';
			draggedEl.style.height = '2.1em';
			// console.log(draggedEl.innerHTML)
			// draggedEl.style.transform = 'scale(0.8)'; // ou via transform
		}
	}

	function getNode(item) {
		return configManager.getChannel(item.channel_id)
	}

	let currentId = 1;
	function addNode() {
		let newNode
		let nodeExist;
		do {
			nodeExist = configManager.selectedConfig[currentId];
			if (!nodeExist) {
				newNode = CST.createNewList();
				newNode.id = 'list' + currentId;
				newNode.name = 'list ' + currentId;
				configManager.selectedConfig[currentId] = newNode;
				configManager.selectedConfig[listId]["items"].push({id: currentId, type: CST.TYPE_LIST})
			} else {
				currentId++;
			}
			// console.log("looking for index", currentId)
		} while (nodeExist);
	}

	addRootNode = addNode;

	function addSeparator() {
		let taken = new Set();
		for (const list of Object.values(configManager.selectedConfig)) {
			for (const item of list?.items ?? []) taken.add(item.id);
		}
		let index = 1;
		while (taken.has('sep' + index)) index++;
		configManager.selectedConfig[listId].items.push({
			id: 'sep' + index,
			type: CST.TYPE_SEPARATOR,
			name: ''
		});
	}

	addRootSeparator = addSeparator;

	// svelte-dnd-action starts a drag on mousedown over an item: without this
	// the separator input would be grabbed instead of focused.
	function keepFocus(e) {
		e.stopPropagation();
	}

	function removeChild(param) {
		let indexToRemove = configManager.selectedConfig[listId].items.findIndex(e => e?.id === param)
		if (indexToRemove >= 0) {
			configManager.selectedConfig[listId].items.splice(indexToRemove,1);
			configChangeEvent.current = null;
		}
	}

	function removeChannel(id) {
		let indexToRemove = configManager.selectedConfig[listId].items.findIndex(e => e?.channel_id === id)
		if (indexToRemove >= 0) {
			configManager.selectedConfig[listId].items.splice(indexToRemove,1);
		}
	}
	
	function selectConfig() {
		// TODO use writable
		// selectSelfForConfig(listId);
		configChangeEvent.current = listId;

		allOthersChannelSelectedEvent.current = false;
	}

	function preventDefault(fn) {
		return function (event) {
			event.preventDesfault();
			fn.call(this, event);
		};
	}

	function selectAllOtherChannels() {
		configChangeEvent.current = listId;
		allOthersChannelSelectedEvent.current = true;
	}
</script>


<div id="list-{listId}" class="list-container" class:is-root={listId === 'rootList'}>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	 {#if listId !== 'rootList'}
	<div class="list-header" onclick={selectConfig}>
		<p class="list-title"><span class="layout-icon-slot"><LayoutIcon /></span><strong>{configManager.selectedConfig[listId]?.name}</strong></p>
		<div class="list-side-menu">
			<button id="add-list-{listId}" class="add-list" onclick={() => addNode()} title={$_('configList.addList', { values: { listId } })}>+</button>
			<button id="add-separator-{listId}" class="add-separator" onclick={(e)=>{ e.stopPropagation(); addSeparator()}} title={$_('configList.addSeparator')}>—</button>
			<button class="delete delete-list" onclick={(e)=>{  e.stopPropagation(); requestDeleteToParent(listId)}}>x</button>
		</div>
	</div>
	{/if}
	{#if configManager.selectedConfig[listId]?.hasOwnProperty("items")}
	<div class="list-body" class:is-empty={showEmptyHint}>
		<section class="dnd-zone-r"
		use:dndzone={{items:configManager.selectedConfig[listId].items, flipDurationMs, centreDraggedOnCursor: false, transformDraggedElement,
			dropTargetClasses: ['increased-drop-margin'], dropFromOthersDisabled: isSmartList
		, morphDisabled: true, useCursorForDetection: true,
		dropTargetStyle: {outline: 'var(--dnd-outline, rgb(191, 148, 255)) solid 2px'}}}
		onconsider={handleDndConsider} 
		onfinalize ={handleDndFinalize}>
			{#each configManager.selectedConfig[listId].items as item(item.id)}
			{#if item.type === CST.TYPE_LIST}
			<div class="nested-list" id={listId + "nested"}>
				<!-- svelte-ignore svelte_self_deprecated -->
				<Self
					listId={item.id}
					requestDeleteToParent={removeChild}
					configManager={configManager} />
			</div>
			{:else if item.type === CST.TYPE_SEPARATOR}
				<div class="channel separator-item">
					<div class="channel-side-menu">
						<button class="delete" id="remove-{item.id}" onclick={()=>{removeChild(item.id)}}>x</button>
					</div>
					<div class="separator-row">
						<span class="separator-dash" aria-hidden="true"></span>
						<input
							type="text"
							class="separator-name"
							bind:value={item.name}
							onmousedown={keepFocus}
							ontouchstart={keepFocus}
							placeholder={$_('configList.separatorPlaceholder')} />
					</div>
				</div>
			{:else if item.channel_id === CST.ALL_OTHER_CHANNELS}
				<div class="channel">
					<div class="other-channels-side-menu">
						<CogBtn onclick={selectAllOtherChannels} />
						<button class="delete" id="remove-{item?.channel_id}" onclick={()=>{removeChannel(item?.channel_id)}}>x</button>
					</div>
					<DraggableChannel
						channelId={CST.ALL_OTHER_CHANNELS_ELEMENT.channel_id}
						channelName={$_('display.allOtherChannels')}
						channelProfilePic={CST.ALL_OTHER_CHANNELS_ELEMENT.profile_image_url} 
						viewerCount={CST.ALL_OTHER_CHANNELS_ELEMENT.viewer_count}
						gameName={CST.ALL_OTHER_CHANNELS_ELEMENT.game_name}
						isLive={CST.ALL_OTHER_CHANNELS_ELEMENT.isLive}
						greyIfOffline={false}/>
				</div>
			{:else}
			{@const i = getNode(item)}
			{@const info = i ?? configManager.getUnfollowedInfo(item.channel_id)}
				<!-- Pas de garde sur `i` ici : svelte-dnd-action exige un enfant
				     DOM par item, sinon les index sautent au drop. Une chaine
				     unfollow s'affiche donc en clair, avec son bouton de
				     suppression, au lieu de disparaitre sans pouvoir etre retiree. -->
					<div class="channel">
						<div class="channel-side-menu">
							<button class="delete" id="remove-{item.channel_id}" onclick={()=>{removeChannel(item.channel_id)}}>x</button>
						</div>
						<DraggableChannel
							channelId={item.channel_id}
							channelName={info?.channel_name ?? item.channel_id}
							channelProfilePic={info?.profile_image_url}
							viewerCount={i?.viewer_count}
							gameName={i?.game_name}
							isLive={i?.isLive ?? false}
							unfollowed={!i}
							greyIfOffline={!!i}
							showOffline={!!i}/>
					</div>
			{/if}
			{/each}
		</section>
		{#if showEmptyHint}
		<div class="empty-hint">
			<div class="empty-hint-grid">
				<span class="arrow-cell">
					<svg class="arrow-up" viewBox="0 0 30 60" aria-hidden="true">
						<path class="arrow-shaft" d="M11 57 C 8 40, 11 26, 16 16 C 18 11, 21 7, 24 4" />
						<path class="arrow-shaft" d="M22.4 10.8 L24 4 L17.2 5.6" />
					</svg>
				</span>
				<p class="hint-text">{$_('configList.emptyAddList')}</p>
				<span class="arrow-cell">
					<svg class="arrow-left" viewBox="0 0 44 32" aria-hidden="true">
						<path class="arrow-shaft" d="M38 30 C 36 18, 27 10, 5 6" />
						<path class="arrow-shaft" d="M9.44 10.04 L5 6 L10.58 3.78" />
					</svg>
				</span>
				<p class="hint-text">{$_('configList.emptyDragChannel')}</p>
			</div>
		</div>
		{/if}
	</div>
	{/if}
</div>

<style>
	.custom-shadow-item{
		color: red;
	}
	.channel {
		position: relative;
	}
	/* floating menus right of a channel, over the DraggableChannel card */
	.channel-side-menu,
	.other-channels-side-menu {
		/* natural width of the .delete button (a UA-font "x" plus its padding),
		   inherited by CogBtn so its plate matches instead of hugging its svg */
		--side-menu-btn-width: 22px;
		position: absolute;
		top: 0;
		right: 0;
		height: 100%;
		width: auto;
		display: flex;
		flex-direction: row;
		align-items: stretch;
		gap: 0.2em;
		z-index: 999;
		opacity: 0;
		transition: opacity 0.2s linear;
	}
	section {
		position: relative;
		width: auto;
		padding: 0 0 .4em 0;
		height: auto;
		min-height: 3em;
		/* background-color: rgb(57, 57, 65); */
		transition: padding 0.15s cubic-bezier(0, 1.19, 0.99, 0.94);
	}
	div {
		width: 100%;
		/* padding: 0.3em;
		margin: 0.15em 0; */
		padding: 0.0em;
		margin: 0em 0;
	}
	.list-side-menu {
		--side-menu-btn-width: 22px;
		display: flex;
		flex-direction: row;
		align-items: stretch;
		align-self: stretch;
		gap: 0.2em;
		margin-left: auto;	/* pins the menu to the right of the header */
		flex: 0 0 auto;
		width: auto;		/* cancels the div { width: 100% } above */
		padding: 0;
		max-height: 100%;
		opacity: 0;
		transition: opacity 0.2s linear;
	}
	/* children (CogBtn's root <div> included) stay items of the row */
	.list-side-menu > :global(*),
	.other-channels-side-menu > :global(*),
	.channel-side-menu > :global(*) {
		display: flex;
		align-items: center;
		flex: 0 0 auto;
		width: auto;
	}
	/* CogBtn's plate keeps the button width, not its svg's: this beats the
	   width: auto above on specificity, whatever order the sheets land in */
	.list-side-menu > :global(.svg-container),
	.other-channels-side-menu > :global(.svg-container),
	.channel-side-menu > :global(.svg-container) {
		width: var(--side-menu-btn-width);
	}
	.list-header:hover .list-side-menu,
	.list-side-menu:hover,
	.channel:hover .other-channels-side-menu,
	.channel:hover .channel-side-menu {
		opacity: 1;
	}
	button {
		margin: 0;
		padding: 0;
	}
	.list-header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: stretch;
		position: relative;
		border-radius: 5px;
		transition: background-color 0.15s ease;
		/* background-color: rgb(191, 148, 255); */
		width: 100%;
		margin: 0;
		/* padding: 0; */
		/* padding: 0.6em 0.3em 0 0.5em; */
		/* border: 1px solid rgb(121, 36, 121); */
		/* border-radius: 7%; */
	}
	.list-header .list-title {
		padding: 0.3em 0 0.3em 0.4em !important;
		display: flex;
		align-items: center;
	}
	.layout-icon-slot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.7em;
		height: 1.7em;
		flex-shrink: 0;
		margin-right: 0.4em;
	}
	.list-container {
		border: none;
		border-radius: 8px;
	}
	.nested-list {
		padding: 0.15em 0;
	}
	.delete {
		border: 1px solid rgba(216, 57, 57, 0.685);
		color: white;
		background-color: rgba(216, 57, 57, 0.685);
		min-width: var(--side-menu-btn-width);
	}
	.add-list,
	.add-separator {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		width: auto;
		padding: 0.6em 1.5em;
		font-weight: 600;
		font-size: 0.95em;
		color: #fff;
		border: none;
		cursor: pointer;
		transition: box-shadow 0.15s ease, transform 0.1s ease;
		background: linear-gradient(135deg, #a970ff, #7a3dff);
	}
	.add-separator {
		padding: 0.6em 1em;
		background: linear-gradient(135deg, #8a8a99, #5c5c6b);
	}
	.separator-item {
		color: #fff;
	}
	.separator-item .separator-row {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 0.6em;
		min-height: 2.1em;
	}
	.separator-dash {
		flex: none;
		width: 1.4em;
		height: 2px;
		border-radius: 1px;
		background: currentColor;
		opacity: 0.5;
	}
	.separator-name {
		flex: 1 1 auto;
		min-width: 0;
		width: auto;
		font-size: 0.9em;
		font-style: italic;
		background: transparent;
		border: none;
		border-bottom: 1px dashed currentColor;
		color: inherit;
	}
	.separator-name:focus {
		outline: none;
		font-style: normal;
	}
	.delete-list {
		height: 100%;
	}
	.list-side-menu button,
	.other-channels-side-menu button,
	.channel-side-menu button{
		height: 100%;
		margin: 0;
		padding: 0.3em 0.5em;
	}
	/* the indent guide replaces the nested borders: one rail per depth level,
	   drawn in the left gutter of the list body (root list has no rail) */
	.list-body {
		box-sizing: border-box;
		position: relative;
		margin: 0;
		padding: 0 0 0 0.75em;
	}
	.list-body::before {
		content: '';
		position: absolute;
		left: 0.25em;
		top: 2px;
		bottom: 2px;
		width: 2px;
		border-radius: 2px;
		background: var(--list-rail, rgba(128, 128, 128, 0.25));
		transition: background-color 0.15s ease;
	}
	.list-container:hover > .list-body::before {
		background: var(--list-rail-active, rgba(128, 128, 128, 0.5));
	}
	.list-container.is-root > .list-body {
		padding-left: 0;
	}
	.list-container.is-root > .list-body::before {
		content: none;
	}
	.list-body.is-empty > section {
		min-height: 12em;
	}
	/* overlay, not a child of the dnd zone: svelte-dnd-action maps its children
	   to items by index and an extra one shifts every drop */
	.empty-hint {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1em 0.8em;
		pointer-events: none;
	}
	.empty-hint-grid {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: start;
		column-gap: 0.7em;
		row-gap: 1.4em;
		width: auto;
		max-width: 21em;
	}
	.empty-hint .arrow-cell {
		display: flex;
		justify-content: center;
		padding-top: 0.15em;
	}
	.empty-hint svg {
		overflow: visible;
		flex-shrink: 0;
	}
	.empty-hint svg.arrow-up {
		width: 2em;
		height: 4em;
	}
	/* wider viewBox scale than arrow-up: matching on-screen stroke needs less width */
	.empty-hint svg.arrow-left {
		width: 3.6em;
		height: 2.6em;
	}
	.empty-hint svg.arrow-left .arrow-shaft {
		stroke-width: 2.45;
	}
	.empty-hint .arrow-shaft {
		fill: none;
		stroke: var(--empty-hint-arrow, rgb(145, 71, 255));
		stroke-width: 3;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.empty-hint .hint-text {
		margin: 0;
		padding: 0;
		font-size: 0.95em;
		line-height: 1.4;
		color: var(--empty-hint-text, inherit);
	}
	:global(div.list-container section.increased-drop-margin) {
		padding-bottom: 1.5em;
	/* padding-top: 1em; */
	/* border: 1px solid green; */
	}
</style>
	
