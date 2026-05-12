<script>
  import ConfigList from './ConfigList.svelte';
  import ConfigPannel from './ConfigPannel.svelte'
  import MainChannelsList from './MainChannelsList.svelte';
  import Display from './Display.svelte';
  import DraggableChannel from './DraggableChannel.svelte';
  import DisplayWrapper from './DisplayWrapper.svelte';
  import ConfigManager from '../configManager.svelte';
  import PortConnector from '../portConnector.js';
  import {  STARTUP_CONF } from '../../constantes.js'
  import { writable, derived } from 'svelte/store';
  

  let configManager = new ConfigManager();
  // let loading = $derived.by(() => {
  //   // console.log(channelsPickRefList2.length)
  //   return false;
  //   // return !(channelsPickRefList2.length > 0 && $channelsConfig && Object.getOwnPropertyNames($channelsConfig).length > 0)
  // });

  let c = configManager.getConfig()
  // let channelsPickRefList = $derived.by(()=> {
  //   if ($channelsPickRef)
  //     return (Array.from($channelsPickRef.values()))
  // })
  // let channelsPickRefList2 = $state(writable(() => channelsPickRefList));
  // let channelsPickRef = $derived(c.channelsPickRef);// = writable([]);
  // let channelsConfig = $derived(c.channelsConfig);
  // let channelsPickRefMap = $derived(c.channelsPickRefMap);
  // let currentConfig = $derived(configManager.currentConfigName); // = writable({
  // let selectedConfig = $derived(c.selectedConfig);
  // let selectedConfigDer = derived([currentConfig, channelsConfig], ([$currentConfig, $channelsConfig]) => {
  //   // console.log("update");
  //   if ($channelsConfig?.configsList) {
  //       let index = $channelsConfig.configsList.find(conf => conf.rootList.name === $currentConfig);
  //       if (index) {
  //         selectedConfig.set(index);
  //         // console.log("selected config", $selectedConfig, index)
  //         return index;
  //       }
  //   }
  // });
  // selectedConfigDer.subscribe(e => e);
  // currentConfig.subscribe(newConfig => {
  //   if (newConfig) {  
  //     let index = channelsConfig.configsList.find(conf => conf.configName === newConfig);
  //     selectedConfig.set($channelsConfig.configsList[index].config);
  //   }
  // })
  // let loading = $derived(false)
  let loading = $derived(!(configManager.channelsPickRef.length > 0 && configManager.channelsConfigList && Object.getOwnPropertyNames(configManager.channelsConfigList).length > 0))



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
  let mode = $state("all channels");
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
    console.log("display", configManager.channelsConfigList);
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
    // console.log($selectedConfig)
    configManager.send(configManager.selectedConfig);
  }

  let themeName = $state(true);

  let theme = (data) => {
      themeName = data.data;
  }
  let port = new PortConnector(theme, "theme");

  function newConfig() {
    let newConfigName = "newConfig";
    let newConfigIndex = 1;
    let configExist;
    // do {
    //   configExist = $channelsConfig.configsList.find(e => e.rootList.name === newConfigName + newConfigIndex);
    //   if (!configExist) {
    //     let newConfig = structuredClone(STARTUP_CONF)
    //     newConfig.rootList.name = newConfigName + newConfigIndex;
    //     channelsConfig.update(e => {
    //       e.configsList.push(newConfig);
    //       return e;
    //     })
    //   currentConfig.set(newConfigName + newConfigIndex);
    //   }
    //   newConfigIndex++;
    // } while (configExist);
    
    
  }

  function selectConfig(configName) {
    currentConfig.set(configName);
    console.log(configName);
  }
</script>

<svelte:head>
  {#if themeName}
	<link rel="stylesheet" href="/assets/sombre.css">
	<link rel="stylesheet" href="/assets/dark_channel.css">
	{:else}
	<link rel="stylesheet" href="/assets/clair.css">
	<link rel="stylesheet" href="/assets/light_channel.css">
	{/if}
</svelte:head>

<div class="overlay-side">
  <div class="popup">
    <div class="header">
      <div class="left">Organisez vos favoris</div>
      <div class="right">
        <button onclick={() => closePopup()} class="cross">X</button>
      </div>
    </div>
    <div class="main">
      {#if loading}
      <div class="loading-wrapper">
        <div class="loading-overlay"></div>
      </div>
      {:else}
        <div class="flex-config">
          <div class="left">
            <button onclick={filterItems}>{mode}</button>
            <button onclick={promptResetConfig}>Reset config</button>
          </div>
          <div class="right">
            {#if configManager.channelsConfigList.length > 0}
            <div class="configs-container">
              <button onclick={newConfig}>
                +
              </button>
              {#each configManager.channelsConfigList as conf(conf.rootList.name)}
                <button onclick={() => { selectConfig(conf.rootList.name) }}>
                  {conf.rootList.name}
                </button>
              {/each}
            </div>
            {:else}
              <p>No configs {configManager.channelsConfigList?.length}</p>
            {/if}
          </div>
        </div>
        <h2>Channels list</h2>
        <div class="flex-container">
          <div class="channels-container">
            {#if configManager.channelsPickRef.length > 0}
            <MainChannelsList items={configManager.channelsPickRef}/>
            {/if}
          </div>
          {#if configManager.channelsPickRef.length}
          <div id="config-list" class="channels-container">
            <ConfigList listId="rootList"
            configManager={configManager}
            requestDeleteToParent={promptResetConfig} />
          </div>
          {/if}
          <div class="config-container">
            <ConfigPannel configManager={configManager}/>
          </div>
          {#if !loading}
          <!-- {#if configManager.channelsPickRef.length && Object.getOwnPropertyNames(configManager.channelsConfigList).length > 0} -->
          <div id="display-container" class="display-container">
            <DisplayWrapper configManager={configManager} />
          </div>
          {/if}
        </div>
        <button id="showC" onclick={showDisplayConf}>Show display conf</button>
        <button onclick={() => send()}>Enregistrer</button>
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
    /* background-color: rgb(24, 24, 27); */
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
    /* display: flex;
    flex-direction: column;
    justify-content: space-between; */
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
  .flex-config {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
</style>
