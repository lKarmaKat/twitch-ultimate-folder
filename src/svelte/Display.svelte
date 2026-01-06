<script>
  	import DraggableChannel from './DraggableChannel.svelte';
    import { ALL_OTHER_CHANNELS } from '../constantes'

    export let listId = "rootList";
    export let channelConfig;
    export let channelRef;
    let behavior = $channelConfig[listId]?.behavior;
    let style = $channelConfig[listId]?.style;
	
	// console.log(`liste ${listId}`, $channelConfig)
	let extendedOnStartup=false;
	let extendOnHover=false;
	let extendOnClick=false;
	let isPinnable=false;

	let header;
	let content;

	channelConfig.subscribe(config => {
		updateStyleVars(listId, config);
	});

	function updateStyleVars(listId, config) {
		behavior = config[listId]?.behavior;
		style = config[listId]?.style;
		if (behavior) {
			extendedOnStartup = $channelConfig[listId].behavior.extendedOnStartup;
			extendOnHover = $channelConfig[listId].behavior.extendOnHover;
			extendOnClick = $channelConfig[listId].behavior.extendOnClick;
			isPinnable = $channelConfig[listId].behavior.isPinnable;
		}
		
		if (style && style.theme === 'CUSTOM') {
			header = style.header;
			content = style.content;
		} else {
			header = '';
			content = '';
		}
	}
	updateStyleVars(listId, $channelConfig[listId]);
	let extended = extendedOnStartup;

    let counter = 0;
	function getNode(item) {
		return $channelRef.find(e => e.channel_id === item.channel_id);
	}

	function getNodeIfLive(item) {
	 	counter = document.querySelectorAll(".channel-overlay.li" + listId ).length;
		return $channelRef.find(e => {
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
				} else if (currentItem.type === 'liste' && $channelConfig[currentItem.id]?.items?.length) {
					c($channelConfig[currentItem.id].items);
				}
			}
		}
		c($channelConfig.rootList.items);
		return set;
	}

	function getAllOtherChannels(ref) {
		let set = getSetAllChannelsInConfig();
		let list = [];
		for (let ch of ref) {
			if (!set.has(ch.channel_id)) {
				list.push(ch);
			}
		}
		list.sort((a,b) => {
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
		});
		// console.log("all others", list.length, list)
		return list;
	}

</script>
	<!-- <div class="width-test">

	</div> -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="list-container">
		{#if listId !== 'rootList'}
		<div class="list-header" style="background-color: {header.headerColor};" on:click={toggleAutoCollapse}>
			<div class="left">
				<p class="list-title">{$channelConfig[listId]?.name}</p>
			</div>
			<div class="right">
				{counter}
			</div>
		</div>
		{/if}
		{#if $channelConfig[listId]?.hasOwnProperty("items")}
			<div class="list-body" class:extended style="background-color: {content.contentColor};">
				<div>
					{#each $channelConfig[listId].items as item(item.id)}
						{#if item.type === "liste"}
							<div class="nested-list">
								<svelte:self  bind:channelConfig={channelConfig} listId={item.id} bind:channelRef={channelRef}></svelte:self>
							</div>
						{:else if item.id === ALL_OTHER_CHANNELS}

							{#each getAllOtherChannels($channelRef) as other(`${other.channel_id}`)}
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
									tick=true/>
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
									tick=true/>
								</div>
							{/if}
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>
			
			
<style>
	div.width-test {
		border: 1px solid red;
		width: 24rem;
		box-sizing: border-box;
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
	.list-header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		padding: 0.6em 0 0 0.3em;
		position: relative;
		/* background-color: rgb(119, 56, 119); */
		width: 100%;
		margin: 0;
		padding: 0;
		/* padding: 0.6em 0.3em 0 0.5em; */
		border: 1px solid rgb(121, 36, 121);
		user-select: none;
		/* border-radius: 7%; */
	}
	.list-container {
		padding: 0 0 0 .1em;
		/* border: 1px solid rgba(128, 128, 128, 0.295); */
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



