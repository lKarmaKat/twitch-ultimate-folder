<script>
  	import DraggableChannel from './DraggableChannel.svelte'
	import { parentFinalizeEvent, configChangeEvent } from "../event.svelte.js";
  	import * as CST from '../../constantes.js'
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
	import { _ } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import Self from './ConfigList.svelte'


	  

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
			console.log(draggedEl.innerHTML)
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
				newNode = CST.NEW_LIST;
				newNode.id = 'list' + currentId;
				newNode.name = 'list ' + currentId;
				// liste[currentId] = structuredClone(newNode);
				// liste[listId]["items"].push({id: currentId, type: CST.TYPE_LIST});
				configManager.selectedConfig[currentId] = structuredClone(newNode);
				configManager.selectedConfig[listId]["items"].push({id: currentId, type: CST.TYPE_LIST})
			} else {
				currentId++;
			}
			console.log("looking for index", currentId)
		} while (nodeExist);
	}

	addRootNode = addNode;

	function removeChild(param) {
		let indexToRemove = configManager.selectedConfig[listId].items.findIndex(e => e?.id === param)
		if (indexToRemove >= 0) {
			configManager.selectedConfig[listId].items.splice(indexToRemove,1);
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
	}
</script>


<div id="list-{listId}" class="list-container">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	 {#if listId !== 'rootList'}
	<div class="list-header" onclick={selectConfig}>
		<!-- <div class="header" style="background-color: {headerColor};"> -->
		<p class="list-title"><strong>{configManager.selectedConfig[listId]?.name}</strong></p>
		<div class="list-side-menu">
			<button id="add-list-{listId}" class="add" onclick={() => addNode()} title={$_('configList.addList', { values: { listId } })}>+</button>
			<button class="delete" onclick={()=>{requestDeleteToParent(listId)}}>x</button>
		</div>
	</div>
	{/if}
	{#if configManager.selectedConfig[listId]?.hasOwnProperty("items")}
	<div class="list-body" >
		<section class="dnd-zone-r"
		use:dndzone={{items:configManager.selectedConfig[listId].items, flipDurationMs, centreDraggedOnCursor: false, transformDraggedElement,
			dropTargetClasses: ['increased-drop-margin']
		, morphDisabled: true, useCursorForDetection: true}} 
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
			{:else if item.id === CST.ALL_OTHER_CHANNELS}
				<DraggableChannel
					channelId={CST.ALL_OTHER_CHANNELS_ELEMENT.channel_id}
					channelName={$_('display.allOtherChannels')}
					channelProfilePic={CST.ALL_OTHER_CHANNELS_ELEMENT.profile_image_url} 
					viewerCount={CST.ALL_OTHER_CHANNELS_ELEMENT.viewer_count}
					gameName={CST.ALL_OTHER_CHANNELS_ELEMENT.game_name}
					isLive={CST.ALL_OTHER_CHANNELS_ELEMENT.isLive}
					bearCard=true/>
			{:else}
			{@const i = getNode(item)}
				<div class="channel">
					<div class="">
						<button class="delete" id="remove-{i?.channel_id}" onclick={()=>{removeChannel(i?.channel_id)}}>x</button>
					</div>
				<DraggableChannel 
					channelId={i?.channel_id} 
					channelName={i?.channel_name} 
					channelProfilePic={i?.profile_image_url} 
					viewerCount={i?.viewer_count}
					gameName={i?.game_name}
					isLive={i?.isLive}/>
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
	.channel .delete {
		position: absolute;
		right: 0;
		top: 0%;
		width: 10%;
		height: 100%;
		visibility: visible;
		transition: opacity 0.2s linear;
		opacity: 0;
		z-index: 999;
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
		visibility: visible;
		opacity: 0;
		transition: opacity 0.2s linear;
		size: 2em;
		margin: 0;
		padding: 0;
		max-height: 100%;
		width: fit-content;
	}
	.channel:hover .delete,
	.list-header:hover .list-side-menu,
	.list-side-menu:hover {
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
		align-items: center;
		padding: 0.3em 0 0.3em 0.4em !important;
		position: relative;
		/* background-color: rgb(191, 148, 255); */
		width: 100%;
		margin: 0;
		/* padding: 0; */
		/* padding: 0.6em 0.3em 0 0.5em; */
		/* border: 1px solid rgb(121, 36, 121); */
		/* border-radius: 7%; */
	}
	.list-container {
		/* padding: 0 0 0 .1em; */
		border: 1px solid rgba(128, 128, 128, 0.295);
	}
	.nested-list {
		padding: 0.3em 0 0.3em 0.3em;
	}
	.delete {
		border: 1px solid rgba(216, 57, 57, 0.685);
		color: white;
		background-color: rgba(216, 57, 57, 0.685);
	}
	.list-body {
		margin: 0;
		padding: 0;
	}
	:global(div.list-container section.increased-drop-margin) {
	padding-bottom: 1.5em;
	/* padding-top: 1em; */
	/* border: 1px solid green; */
	}
</style>
	
