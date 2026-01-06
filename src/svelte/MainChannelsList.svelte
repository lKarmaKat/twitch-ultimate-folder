<script>
    import DraggableChannel from './DraggableChannel.svelte';
    import { parentFinalizeEvent } from "./event.js";

    import { dndzone, TRIGGERS, SHADOW_ITEM_MARKER_PROPERTY_NAME, DRAGGED_ELEMENT_ID } from "svelte-dnd-action";

    export let items;
  
    let shouldIgnoreDndEvents = false;
    let count = 0;
    function handleDndConsider(e) {
        // count++;
        const {trigger, id} = e.detail.info;
        if (trigger === TRIGGERS.DRAG_STARTED) {
            const idx = $items.findIndex(item => item.id === id);
            const newId = `${id}_copy_${Math.round(Math.random()*100000)}`;
						// the line below was added in order to be compatible with version svelte-dnd-action 0.7.4 and above 
					  e.detail.items = e.detail.items.filter(item => !item[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
            e.detail.items.splice(idx, 0, {...$items[idx], id: newId});
            // items = e.detail.items;
            items.update(list => e.detail.items);
            shouldIgnoreDndEvents = true;
        }
        else if (!shouldIgnoreDndEvents) {
          // items = e.detail.items;
          items.update(list => e.detail.items);
        }
        else {
            // items = [...items];
            items.update(list => list);
        }
    }
    function handleDndFinalize(e) {
      // console.log("finalize");
      parentFinalizeEvent.set(e.detail);

        if (!shouldIgnoreDndEvents) {
            // items = e.detail.items;
          items.update(list => e.detail.items);
        }
        else {
            // items = [...items];
            items.update(list => e.detail.items);
            shouldIgnoreDndEvents = false;
        }
    }
    const flipDurationMs = 0;


function show() {
  console.log("list", $items);
}
</script>

<style></style>



<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<section on:click={show}  id="main-channels-list" class="channels" use:dndzone={{items: $items, flipDurationMs, dropFromOthersDisabled: true}} on:consider={handleDndConsider} on:finalize={handleDndFinalize}>
            {#each $items as item(item.id)}
            <DraggableChannel 
            channelId={item.channel_id} 
            channelName={item.channel_name} 
            channelProfilePic={item.profile_image_url} 
            viewerCount={item.viewer_count}
            gameName={item.game_name}
            isLive={item.isLive}
            color=''/>
            {/each}
</section>

