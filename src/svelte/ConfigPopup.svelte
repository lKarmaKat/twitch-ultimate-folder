<script>
  import ConfigList from './ConfigList.svelte';
  import ConfigManager from '../content_script/configManager';
  import ConfigPannel from './ConfigPannel.svelte'
  import MainChannelsList from './MainChannelsList.svelte';
  import Display from './Display.svelte';
  import { writable } from 'svelte/store';
  // import { onMount } from 'svelte';
  import { ALL_OTHER_CHANNELS } from '../constantes.js'
  import { dndzone, TRIGGERS, SHADOW_ITEM_MARKER_PROPERTY_NAME, DRAGGED_ELEMENT_ID } from "svelte-dnd-action";

  let configManager = new ConfigManager();
  let loading = true;

  let c = configManager.getConfig()
  let channelsPickRef = c.channelsPickRef;// = writable([]);
  let channelsConfig = c.channelsConfig; // = writable({
  $ : if ($channelsPickRef.length > 0 && Object.getOwnPropertyNames($channelsConfig).length > 0) {
    loading = false;
  }



  //   listeRacine: {
  //     id:'node1',
  //     name:'liste principale',
  //     items:[]
  //   }
  // });
  // onMount(() => {
    // console.log("onMount");
    // channelsPickRef = c.channelsPickRef;
    // channelsConfig = c.channelsConfig;
    // configManager.getConfig().then(obj => {
    //   channelsPickRef = obj.channelsPickRef;
    //   channelsConfig = obj.channelsConfig;
    // });
  // });


  let a = false;
  let mode = "all channels";
  function filterItems() {
  if (a) {
    channelsPickRef = save;
    mode = "all channels";
  } else {
    mode = "online only";
    channelsPickRef = save.filter(e => e.isLive);
  }
  a = !a;
  }


  function showDisplayConf() {
  console.log("display", $channelsConfig);
  }
  function closePopup() {
  chrome.runtime.sendMessage({type: 'HIDE_POPUP'});
  }

  function promptResetConfig() {
    let rep = prompt("reset config principale ?", "oui");
    if (rep === "oui") {
      resetConfig();
    }
  }
  function resetConfig() {
    configManager.resetConfig().then(data => {
      channelsConfig = data;
    })
  }
  function send() {
    configManager.send($channelsConfig);
  }

  ////////////////////////////////////////////////
  ////////////////////////////////////////////////
  ////////////////////////////////////////////////
  let allOtherItems = [{id: ALL_OTHER_CHANNELS, name: "allOthers"}];

  function handleDndConsider(e) {
    allOtherItems = e.detail.items;
  }
  let themeName = writable(true);
  import PortConnector from '../content_script/portConnector.js';

  let theme = (data) => {
      themeName = data.data;
  }
  let port = new PortConnector(theme, "theme");

</script>

<svelte:head>
  {#if themeName}
	<link rel="stylesheet" href="/assets/sombre.css">
	{:else}
	<link rel="stylesheet" href="/assets/clair.css">
	{/if}
</svelte:head>

<div class="overlay-side">
  <div class="popup">
    <div class="header">
      <div class="left">Organisez vos favoris</div>
      <div class="right">
        <button on:click={() => closePopup()} class="cross">X</button>
      </div>
    </div>
    <div class="main">
      {#if loading}
      <div class="loading-wrapper">
        <div class="loading-overlay"></div>
      </div>
      {:else}
        <button on:click={filterItems}>{mode}</button>
        <button on:click={promptResetConfig}>Reset config</button>
        <h2>Channels list</h2>
        <div class="flex-container">
          <div class="channels-container">
            {#if $channelsPickRef.length}
            <MainChannelsList bind:items={channelsPickRef}/>
            {/if}
            <br />
            <section class="channels" use:dndzone={{items: allOtherItems, dropFromOthersDisabled: true}} on:consider={handleDndConsider} on:finalize={handleDndConsider}>
              {#each allOtherItems as item(item.id)}
                <div class="allOthers">{item.name}</div>
              {/each}
            </section>
          </div>
          {#if $channelsPickRef.length}
          <div id="config-list" class="channels-container">
            <ConfigList listId={"rootList"}
            bind:channelConfig={channelsConfig}
            bind:channelRef={channelsPickRef}
            requestDeleteToParent={promptResetConfig} />
          </div>
          {/if}
          <div class="config-container">
            <ConfigPannel bind:channelConfig={channelsConfig}/>
          </div>
          <p class="el">{Object.getOwnPropertyNames($channelsConfig).length}</p>
          {#if $channelsPickRef.length && Object.getOwnPropertyNames($channelsConfig).length > 0}
          <div class="display-container">
            <Display listId={"rootList"} bind:channelConfig={channelsConfig} bind:channelRef={channelsPickRef} />
          </div>
          {/if}
        </div>
        <button on:click={showDisplayConf}>Show display conf</button>
        <button on:click={() => send()}>Enregistrer</button>
      {/if}
    </div>
  </div>
</div>


<style>
  .loading-wrapper {
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .loading-overlay {
    width: 120px;
    padding: 16px;
    aspect-ratio: 1;
    border-radius: 50%;
    background: #a970ff;
    --_m: 
      conic-gradient(#0000 10%,#000),
      linear-gradient(#000 0 0) content-box;
    -webkit-mask: var(--_m);
            mask: var(--_m);
    -webkit-mask-composite: source-out;
            mask-composite: subtract;
    animation: l3 1s infinite linear;
  }
  @keyframes l3 {to{transform: rotate(1turn)}}
  .allOthers {
    width: 100%;
    height: 30px;
    border: 1px solid grey;
  }
  .header {
    /* color: rgb(191, 148, 255); */
    background-color: rgb(24, 24, 27);
    width: 100%;
    height: 2.5em;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: .8em;
  }

  div.overlay-side {
    position: fixed;
    display: block;
    width: 100%;
    height: 100%;
    padding: 10px;
    background-color: rgba(20, 20, 20, 0.5);
  }
  div.popup {
    position: fixed;
    font-family: sans-serif;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    /* background-color: rgb(57, 57, 65); */
    /* background-color: rgba(30, 41, 40, 1); */
    width: 70%;
    height: 80%;
    left: 15%;
    top: 10%;
  }

  div.channels-container,
  div.display-container {
    max-height: 100%;
    /* border: 1px solid blue; */
    overflow-y: scroll;
    flex: 0 1 14%;
  }
  div.config-container {
    /* width: 35%; */
    flex: 3 1 30%;
  }
  div.display-container {
    /* width: 23% */
    flex: 1 1 15%;
  }
  .main {
    height: 80%;
    margin-top: 3em;
    margin-bottom: 3em;
    margin-left: 2em;
    /* border: 1px solid red; */
  }
  div.flex-container {
    display: flex;
    flex-direction: row;
    height: 95%;
  }
</style>