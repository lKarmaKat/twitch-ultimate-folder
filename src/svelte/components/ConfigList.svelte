<script>
  	import DraggableChannel from './DraggableChannel.svelte'
	import { parentFinalizeEvent, configChangeEvent } from "../event.js";
  	import * as CST from '../../constantes.js'
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
	import Self from './ConfigList.svelte'


	  

	  let { configManager, listId, requestDeleteToParent } = $props()

	  let refMap = $derived.by(() => {
		console.log("updated in configList ", configManager.channelsPickRefMap);
		return configManager.channelsPickRefMap
	});

	// let duplicatedElementError = $derived(!)
	let duplicatedElementError = $state(false)
	parentFinalizeEvent.subscribe((value) => {
		duplicatedElementError = !value
	})

	const flipDurationMs = 80;
	function handleDndConsider(e) {
		// Use an immutable update to ensure subscribers and dnd-action
		// get a new object/array reference instead of mutating in place.
		const newItems = e.detail.items;
		configManager.selectedConfig[listId].items = newItems;
		// channelConfig.update(current => {
		// 	const copy = structuredClone(current);
		// 	copy[listId] = { ...(copy[listId] || {}), items: newItems };
		// 	return copy;
		// });
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
		let newIt = e.detail.items.findIndex(i => i.id === id)
		// if (newIt) {
		// 	e.detail.items[newIt] = {"channel_id": e.detail.items[newIt].channel_id, "id": e.detail.items[newIt].id}
		// }
		configManager.selectedConfig[listId].items = newItems;
		//channelConfig.update(liste => {
			// console.log("UPDATE DROP")
		//	return liste
		//});
		// channelConfig.update(current => {
		// 	const copy = structuredClone(current);
		// 	copy[listId] = { ...(copy[listId] || {}), items: newItems };
		// 	return copy;
		// });
	}

	function transformDraggedElement(draggedEl, draggedData, draggedIndex) {
		if (duplicatedElementError) {
			if (!draggedData.save) {
				draggedData.save = draggedEl.innerHTML;
			}
			draggedEl.innerHTML = "<strong>L'élément est déjà dans la liste</strong>";
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
		return configManager.channelsPickRefMap.get(item.channel_id)
	}
	let currentId = 10;
	function addNode() {
		channelConfig.update(liste => {
			let nodeExist;
			do {
				nodeExist = liste[currentId];
				if (!nodeExist) {
					let newNode = CST.NEW_LIST;
					newNode.id = 'list' + currentId;
					newNode.name = 'list ' + currentId;
					liste[currentId] = structuredClone(newNode);
					liste[listId]["items"].push({id: currentId, type: CST.TYPE_LIST});
				}
				currentId++;
			} while (nodeExist);
			return liste;
		});
	}

	function removeChild(param) {
		console.log(`called from ${param} in ${listId}`)
		channelConfig.update(liste => {
			delete(liste[param]);
			let toRemove = channelConfig[listId].items.findIndex(e => e?.id === param);
			if (toRemove >= 0) {
				liste[listId].items.splice(toRemove,1);
				// configChangeEvent.set(null);
			}
			return liste;
		})
	}

	function removeChannel(id) {
		channelConfig.update(liste => {
			let toRemove = channelConfig[listId].items.findIndex(e => e?.channel_id === id);
			if (toRemove >= 0) {
				liste[listId].items.splice(toRemove,1);
				// configChangeEvent.set(null);
			}
			return liste;
		})
	}
	
	function selectConfig() {
		// TODO use writable
		// selectSelfForConfig(listId);
		configChangeEvent.set(listId);
	}
</script>


<div id="list-{listId}" class="list-container">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="list-header" onclick={selectConfig}>
		<!-- <div class="header" style="background-color: {headerColor};"> -->
		<p class="list-title">{configManager.selectedConfig[listId]?.name}</p>
		<div class="list-side-menu">
			<button id="add-list-{listId}" class="add" onclick={() => addNode()} title="Add new list in {listId}">+</button>
			<button class="delete" onclick={()=>{requestDeleteToParent(listId)}}>x</button>
		</div>
	</div>
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
                  channelId={item.channel_id} 
                  channelName={item.channel_name} 
                  channelProfilePic={item.profile_image_url} 
                  viewerCount={item.viewer_count}
                  gameName={item.game_name}
                  isLive={item.isLive}
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
		padding: 0 0 0 .1em;
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
	