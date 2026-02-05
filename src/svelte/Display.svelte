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

	let extended = extendedOnStartup;

	channelConfig.subscribe(config => {
		updateStyleVars(listId, config);
	});

	function updateStyleVars(listId, config) {
		if (config) {
			behavior = config[listId]?.behavior;
			style = config[listId]?.style;
			if (behavior) {
				if (extendedOnStartup !== $channelConfig[listId].behavior.extendedOnStartup)
					extended = $channelConfig[listId].behavior.extendedOnStartup;
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
		
	}
	updateStyleVars(listId, $channelConfig[listId]);

    let counter = 0;
	function getNode(item) {
		return $channelRef.find(e => e.channel_id === item.channel_id);
	}

	function getNodeIfLive(item) {
	 	// counter = document.querySelectorAll(".channel-overlay.li" + listId ).length;
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
		if (item.sort === 'ALPHA')
			list.sort(alphaSortCallback);
		else 
			list.sort(viewerCountSortCallback);
		// console.log("all others", list.length, list)
		counter = liveChannels.size + c;
		return list;
	}

	let liveChannels = new Set();
	$: {
		// Reactive statement that updates whenever channelRef or channelConfig changes
		// console.log("$ Update display " + listId);
		liveChannels = new Set();
		let hasAllOthers = false;
		if ($channelConfig[listId] && $channelConfig[listId].items) {
			for (let ch of $channelConfig[listId].items) {
				if (ch.id === ALL_OTHER_CHANNELS) {
					hasAllOthers = true;
				} else {
					let liveChannel = getNodeIfLive(ch);
					if (liveChannel) {
						liveChannels.add(ch);
					}
				}
			}
			counter = liveChannels.size;
		}
	}

	function atLeastOneLiveChannel() {
		// console.log("Update display " + listId);
		let hasAllOthers = false;
		if ($channelConfig[listId] && $channelConfig[listId].items) {
			for (let ch of $channelConfig[listId].items) {
				if (ch.id === ALL_OTHER_CHANNELS) {
					hasAllOthers = true;
					break;
				}
			}
		}
		return liveChannels.size > 0 || hasAllOthers;
	}

</script>
	<!-- <div class="width-test">

	</div> -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	 {#if liveChannels.size > 0 || atLeastOneLiveChannel()}
	<div class="list-container">
		{#if listId !== 'rootList'}
		<div class="list-header" style="background-color: {header.headerColor};" on:click={toggleAutoCollapse}>
			<div class="left">
				<p class="list-title">{$channelConfig[listId]?.name}</p>
			</div>
			<div class="right">
				<p>
					{counter}
				</p>
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

							{#each getAllOtherChannels($channelRef, item) as other(`${other.channel_id}`)}
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
		padding: 0.4em 0 0.4em 0.4em;
		/* position: relative; */
		/* background-color: rgb(119, 56, 119); */
		/* width: 100%; */
		/* margin: 0; */
		/* padding: 0; */
		/* padding: 0.6em 0.3em 0 0.5em; */
		user-select: none;
		/* border-radius: 7%; */
	}
	.right {
		width: auto;
		padding-right: 4px;
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



