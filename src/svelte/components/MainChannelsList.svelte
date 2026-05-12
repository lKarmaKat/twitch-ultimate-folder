<script>
    import DraggableChannel from './DraggableChannel.svelte';
    import { parentFinalizeEvent } from "../event.js";
    import { derived, writable } from 'svelte/store';
    
    import { dndzone, TRIGGERS, SHADOW_ITEM_MARKER_PROPERTY_NAME, DRAGGED_ELEMENT_ID } from "svelte-dnd-action";

    let { items } = $props();

    let searchString = $state('');


    let filtered = $derived.by(() => {
      if (!items || items.length < 1) {
        return writable([{
          id: -1,
          channel_name: "No channels to display"
        }])
      }
      let a = items;
      let set = new Set(items);
      if (searchString.length > 0) {
        a = items.filter(x => {
          if (x.channel_name.toLowerCase().includes(searchString.toLowerCase()))
          return x.channel_name.toLowerCase().includes(searchString.toLowerCase());
        })
      }
      return a;
    }
    );
  
    let shouldIgnoreDndEvents = false;
    let count = 0;
    function handleDndConsider(e) {
        count++;
        const {trigger, id} = e.detail.info;
        if (trigger === TRIGGERS.DRAG_STARTED) {
            const idx = filtered.findIndex(item => item.id === id);
            const newId = `${id}_copy_${Math.round(Math.random()*100000)}`;
						// the line below was added in order to be compatible with version svelte-dnd-action 0.7.4 and above 
					  e.detail.items = e.detail.items.filter(item => !item[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
            e.detail.items.splice(idx, 0, {...filtered[idx], id: newId});
            // items = e.detail.items;
            filtered = e.detail.items;
            shouldIgnoreDndEvents = true;
        }
        else if (!shouldIgnoreDndEvents) {
          filtered = e.detail.items;
        }
    }
    function handleDndFinalize(e) {
      parentFinalizeEvent.set(e.detail);

        if (!shouldIgnoreDndEvents) {
          filtered = e.detail.items;
        }
        else {
            filtered = e.detail.items;
            shouldIgnoreDndEvents = false;
        }
    }
    const flipDurationMs = 0;

function show() {
  console.log("list", $items);
}
</script>

<style>
    section {
      overflow-y: scroll;
      max-height: 95%;
    }
    input[type=text] {
        font-size: 1em;
        background: transparent;
        border: none;
    }
    input[type="text"]:focus {
        outline: none;
    }
    :global(section a) {
        padding: 0.357em 0.57em;
    }
</style>



<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
 <div>
  <!-- <input type="text" name="listFilter" id="listFilter" placeholder="Search through channels" bind:value={searchString} oninput={searchChange} /> -->
  <input type="text" name="listFilter" id="listFilter" placeholder="Search through channels" bind:value={searchString} />
 </div>
<section onclick={show}  id="main-channels-list" class="channels" use:dndzone={{items: filtered, flipDurationMs, dropFromOthersDisabled: true}} onconsider={handleDndConsider} onfinalize={handleDndFinalize}>
            {#each filtered as item(item.id)}
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

