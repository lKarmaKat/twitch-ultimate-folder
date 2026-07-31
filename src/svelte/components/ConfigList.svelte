<script>
  	import DraggableChannel from './DraggableChannel.svelte'
	import { parentFinalizeEvent, configChangeEvent, allOthersChannelSelectedEvent } from "../event.svelte.js";
  	import * as CST from '../../constantes.js'
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
	import { _ } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import Self from './ConfigList.svelte'
    import CogBtn from './CogBtn.svelte';


	  

	let { configManager, listId, requestDeleteToParent, addRootNode = $bindable() } = $props()


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
			if (i.type !== CST.TYPE_LIST)
				map.set(i.channel_id, true);
		});
		return e.detail.items.filter(i => i.type !== CST.TYPE_LIST).length !== map.size;
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
		<!-- <div class="header" style="background-color: {headerColor};"> -->
		<p class="list-title"><strong>{configManager.selectedConfig[listId]?.name}</strong></p>
		<div class="list-side-menu">
			<button id="add-list-{listId}" class="add-list" onclick={() => addNode()} title={$_('configList.addList', { values: { listId } })}>+</button>
			<button class="delete delete-list" onclick={(e)=>{  e.stopPropagation(); requestDeleteToParent(listId)}}>x</button>
		</div>
	</div>
	{/if}
	{#if configManager.selectedConfig[listId]?.hasOwnProperty("items")}
	<div class="list-body" >
		<section class="dnd-zone-r"
		use:dndzone={{items:configManager.selectedConfig[listId].items, flipDurationMs, centreDraggedOnCursor: false, transformDraggedElement,
			dropTargetClasses: ['increased-drop-margin']
		, morphDisabled: true, useCursorForDetection: true,
		dropTargetStyle: {outline: 'var(--dnd-outline, rgb(191, 148, 255)) solid 2px'}}} 
		onconsider={handleDndConsider} 
		onfinalize ={handleDndFinalize}>
		<!-- style="background-color: {contentColor};">		 -->
			{#each configManager.selectedConfig[listId].items as item(item.id)}
			{#if item.type === CST.TYPE_LIST}
			<div class="nested-list" id={listId + "nested"}>
				<!-- svelte-ignore svelte_self_deprecated -->
				<Self
					listId={item.id}
					requestDeleteToParent={removeChild}
					configManager={configManager} />
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
							<!-- <div>chaine</div> -->
							<!-- color={contentColor}/> -->
					</div>
			{/if}
			{/each}
		</section>
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
	}
	.add-list {
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
	:global(div.list-container section.increased-drop-margin) {
		padding-bottom: 1.5em;
	/* padding-top: 1em; */
	/* border: 1px solid green; */
	}
</style>
	
