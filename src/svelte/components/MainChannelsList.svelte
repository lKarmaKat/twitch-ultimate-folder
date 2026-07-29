<script>
    import DraggableChannel from './DraggableChannel.svelte';
    import { parentFinalizeEvent } from "../event.svelte.js";
    import { _ } from 'svelte-i18n';
    import { derived, writable, get } from 'svelte/store';
    
    import { dndzone, TRIGGERS, SHADOW_ITEM_MARKER_PROPERTY_NAME, DRAGGED_ELEMENT_ID } from "svelte-dnd-action";

    let { items } = $props();

    let searchString = $state('');

    let itemsWithIds = $derived.by(() => {
      if (!items) return [];
      return items.map(item => ({
        ...item,
        id: item.channel_id + Math.round(Math.random() * 100000)
      }));
    });


    let filtered = $derived.by(() => {
      if (!itemsWithIds || itemsWithIds.length < 1) {
        return writable([{
          id: -1,
          channel_name: get(_)('mainList.noChannels')
        }])
      }
      let a = itemsWithIds;
      let set = new Set(itemsWithIds);
      if (searchString.length > 0) {
        a = itemsWithIds.filter(x => {
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
            const newId = id + Math.round(Math.random()*100000);
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
      parentFinalizeEvent.current = e.detail;

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
    .channels-list-root {
        display: flex;
        flex-direction: column;
        height: 100%;
        max-height: 100%;
    }
    .list-header {
        flex: 0 0 auto;
    }
    section {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      /* max-height: 95%; */
    }
    input[type=text] {
        font-size: 1em;
        background: transparent;
        border: none;
        width: 90%;
    }
    input[type="text"]:focus {
        outline: none;
    }
    :global(section#main-channels-list a) {
      /* border: 1px solid red !important; */
        padding: 0.357em 0em 0.357em 0em;
    }

</style>



<div class="channels-list-root">
  <div class="list-header">
    <!-- <input type="text" name="listFilter" id="listFilter" placeholder="Search through channels" bind:value={searchString} oninput={searchChange} /> -->
    <input type="text" name="listFilter" id="listFilter" placeholder={$_('mainList.searchPlaceholder')} bind:value={searchString} />
  </div>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <section onclick={show}  id="main-channels-list" class="channels" use:dndzone={{items: filtered, flipDurationMs, dropFromOthersDisabled: true}} onconsider={handleDndConsider} onfinalize={handleDndFinalize}>
              {#each filtered as item(item.id)}
              <DraggableChannel
              channelId={item.channel_id}
              channelName={item.channel_name}
              channelProfilePic={item.profile_image_url}
              viewerCount={item.viewer_count}
              gameName={item.game_name}
              isLive={item.isLive}
              greyIfOffline={false}
              showOffline={false}/>
              {/each}
  </section>
</div>

