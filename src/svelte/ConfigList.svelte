<script>
	import { dndzone } from 'svelte-dnd-action';
  	import DraggableChannel from './DraggableChannel.svelte'
	import { parentFinalizeEvent, configChangeEvent } from "./event.js";
  	import { ALL_OTHER_CHANNELS } from '../../../constantes.js'
	
	export let channelConfig;
	export let listId;
	export let channelRef;
	export let requestDeleteToParent;

	$: if ($parentFinalizeEvent ) {
		error = false;
	}


	const flipDurationMs = 80;
	let error = false;
	function handleDndConsider(e) {
		$channelConfig[listId].items = e.detail.items;
		if (itemAlreadyInList(e)) {
			error = true;
		} else {
			error = false;
		}
	}

	function itemAlreadyInList(e) {
		let map = new Map();
		e.detail.items.forEach(i => {
			if (i.type !== 'liste')
				map.set(i.channel_id, true);
		});
		return e.detail.items.filter(i => i.type !== 'liste').length !== map.size;
	}

	function handleDndFinalize(e) {
		error = false;
		let id = e.detail.info.id;
		if (itemAlreadyInList(e)) {
			$channelConfig[listId].items = e.detail.items.filter(i => i.id !== id);
		} else {
			$channelConfig[listId].items = e.detail.items;
		}
	}

	function transformDraggedElement(draggedEl, draggedData, draggedIndex) {
		if (error) {
			if (!draggedData.save) {
				draggedData.save = draggedEl.innerHTML;
			}
			draggedEl.innerHTML = "<strong>L'élément est déjà dans la liste</strong>";
			draggedEl.style.cursor = 'not-allowed';
		} else if (draggedData.save) {
			draggedEl.innerHTML = draggedData.save;
			draggedEl.style.cursor = 'grab';

		}
	}

	function getNode(item) {
		return $channelRef.find(e => e.channel_id === item.channel_id);
	}
	let currentId = 10;
	function addNode() {
		channelConfig.update(liste => {
			let nodeExist = liste[currentId];
			do {
				nodeExist = liste[currentId];
				if (!nodeExist) {
					liste[currentId] = {
						name: 'list ' + currentId,
						id: 'list ' + currentId,
						items: [],
						type: 'liste',
						behavior: {
							extendedOnStartup: true,
							extendOnHover: true,
							extendOnClick: false,
							isPinnable: false
						},
						style: {
							headerColor: "#808080",
							contentColor: "#808080"
						}
					}
					liste[listId]["items"].push({id: currentId, type: 'liste'});
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
			let toRemove = $channelConfig[listId].items.findIndex(e => e?.id === param);
			if (toRemove >= 0) {
				liste[listId].items.splice(toRemove,1);
				// configChangeEvent.set(null);
			}
			return liste;
		})
	}

	function removeChannel(id) {
		channelConfig.update(liste => {
			let toRemove = $channelConfig[listId].items.findIndex(e => e?.channel_id === id);
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


<div class="list-container">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="list-header" on:click={selectConfig}>
		<!-- <div class="header" style="background-color: {headerColor};"> -->
		<p class="list-title">{$channelConfig[listId]?.name}</p>
		<div class="list-side-menu">
			<button class="add" on:click={() => addNode()} title="Add new list in {listId}">+</button>
			<button class="delete" on:click={()=>{requestDeleteToParent(listId)}}>x</button>
		</div>
	</div>
	{#if $channelConfig[listId]?.hasOwnProperty("items")}
	<div class="list-body" >
		<section 
		use:dndzone={{items:$channelConfig[listId].items, flipDurationMs, centreDraggedOnCursor: false, transformDraggedElement,
			dropTargetClasses: ['increased-drop-margin']
		}} 
		on:consider={handleDndConsider} 
		on:finalize={handleDndFinalize}>
		<!-- style="background-color: {contentColor};">		 -->
			{#each $channelConfig[listId].items as item(item.id)}
			{#if item.type === "liste"}
			<div class="nested-list">
				<svelte:self requestDeleteToParent={removeChild} bind:channelConfig={channelConfig} listId={item.id} bind:channelRef={channelRef}></svelte:self>
			</div>
			{:else if item.id === ALL_OTHER_CHANNELS}
				<p>AllOthers</p>
			{:else}
			{@const i = getNode(item)}
				<div class="channel">
					<div class="">
						<button class="delete" on:click={()=>{removeChannel(i?.channel_id)}}>x</button>
					</div>
					<DraggableChannel 
					channelId={i?.channel_id} 
					channelName={i?.channel_name} 
					channelProfilePic={i?.profile_image_url} 
					viewerCount={i?.viewer_count}
					gameName={i?.game_name}
					isLive={i?.isLive}
					tick=true/>
					<!-- color={contentColor}/> -->
				</div>
				{/if}
				{/each}
		</section>
	</div>
	{/if}
</div>

<style>
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
		padding: 0.6em 0 0 0.3em;
		position: relative;
		background-color: rgb(119, 56, 119);
		width: 100%;
		margin: 0;
		padding: 0;
		/* padding: 0.6em 0.3em 0 0.5em; */
		border: 1px solid rgb(121, 36, 121);;
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
	