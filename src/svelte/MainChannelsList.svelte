<script>
    import DraggableChannel from './DraggableChannel.svelte';
    import { parentFinalizeEvent } from "./event.js";
    import { derived, writable } from 'svelte/store';
    import { dndzone, TRIGGERS, SHADOW_ITEM_MARKER_PROPERTY_NAME, DRAGGED_ELEMENT_ID } from "svelte-dnd-action";

    export let items;
    export let search = writable('');
    
    let searchString = '';
    let filteredItems = writable($items);

    // let filtered = writable([]);
    const filtered = derived(
          [search, items],
          ([$search, $items]) => {
            let a = $items;
            if ($search.length > 0) {
              // console.log("{{{{{{{{{{search", $search);
               a = $items.filter(x => {
                if (x.channel_name.toLowerCase().includes($search.toLowerCase()))
                  console.log(x.channel_name.toLowerCase(), x.channel_name.toLowerCase().includes($search.toLowerCase()));
                return x.channel_name.toLowerCase().includes($search.toLowerCase());
              })
            }
            // console.log('}}}}}}}}}}}}}}}}}}}}}')
          filteredItems.set(a);
          return a;
      }
    );
    filtered.subscribe(e => e);
  
    let shouldIgnoreDndEvents = false;
    let count = 0;
    function handleDndConsider(e) {
        // count++;
        const {trigger, id} = e.detail.info;
        if (trigger === TRIGGERS.DRAG_STARTED) {
            const idx = $filteredItems.findIndex(item => item.id === id);
            const newId = `${id}_copy_${Math.round(Math.random()*100000)}`;
						// the line below was added in order to be compatible with version svelte-dnd-action 0.7.4 and above 
					  e.detail.items = e.detail.items.filter(item => !item[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
            e.detail.items.splice(idx, 0, {...$filteredItems[idx], id: newId});
            // items = e.detail.items;
            filteredItems.update(list => e.detail.items);
            shouldIgnoreDndEvents = true;
        }
        else if (!shouldIgnoreDndEvents) {
          // items = e.detail.items;
          filteredItems.update(list => e.detail.items);
        }
        else {
            // items = [...items];
            filteredItems.update(list => list);
        }
    }
    function handleDndFinalize(e) {
      // console.log("finalize");
      parentFinalizeEvent.set(e.detail);

        if (!shouldIgnoreDndEvents) {
            // items = e.detail.items;
          filteredItems.update(list => e.detail.items);
        }
        else {
            // items = [...items];
            filteredItems.update(list => e.detail.items);
            shouldIgnoreDndEvents = false;
        }
    }
    const flipDurationMs = 0;

    function searchChange() {
      search.update( e=> searchString)
    }

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
</style>



<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
 <div>
  <input type="text" name="listFilter" id="listFilter" placeholder="Search through channels" bind:value={searchString} on:input={searchChange} />
 </div>
<section on:click={show}  id="main-channels-list" class="channels" use:dndzone={{items: $filteredItems, flipDurationMs, dropFromOthersDisabled: true}} on:consider={handleDndConsider} on:finalize={handleDndFinalize}>
            {#each $filteredItems as item(item.id)}
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

