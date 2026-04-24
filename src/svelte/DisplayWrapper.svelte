<script>
  import Display from './Display.svelte';
  // import { ConfigManager } from './configManager';
  import ConfigManager from '../content_script/configManager';
  // import PortConnector from '../content_script/portConnector';
  import WaitingConfig from './WaitingConfig.svelte';
  import { writable, derived } from 'svelte/store';

  // import { onMount } from 'svelte';
  // import { writable } from 'svelte/store';

  export let configManager = new ConfigManager();

  let c = configManager.getConfig();
  let channelsPickRef = c.channelsPickRef;// = writable([]);
  let channelsConfig = c.channelsConfig; // = writable({
  let currentConfig = configManager.currentConfig; // = writable({
  let selectedConfig = writable();
  // channelsConfig.subscribe(e => {
  //   console.log("Config found", e);
  //   if ($currentConfig) {
  //     let index = $channelsConfig?.configsList.find(conf => conf.rootList?.name === $currentConfig);
  //       if (index) {
  //         selectedConfig.set(index);
  //         console.log("selected config", $selectedConfig, index)
  //         return index;
  //       }
  //   }
  // })
  let selectedConfigDer = derived([currentConfig, channelsConfig], ([$currentConfig, $channelsConfig]) => {
    // console.log("update");
    if ($channelsConfig?.configsList) {
        let index = $channelsConfig.configsList.find(conf => conf.rootList.name === $currentConfig);
        if (index) {
          selectedConfig.set(index);
          // console.log("selected config", $selectedConfig, index)
          return index;
        }
    }
  });
  selectedConfigDer.subscribe(e => e);
  // channelsPickRef.subscribe(e => console.log("new channelpic", e))
  // channelsConfig.subscribe(e => console.log("new channelsConfig", e))
  //   });
  //   listeRacine: {
  //     id:'node1',
  //     name:'liste principale',
  //     items:[]
  //   }
  // });
  // onMount(() => {
  //   configManager.getConfig().then(obj => {
  //     channelsPickRef = obj.channelsPickRef;
  //     channelsConfig = obj.channelsConfig;
  //   });
  // });

  // let themeName = writable(true);

  // let theme = (data) => {
  //     themeName = data.data;
  // }
  // let port = new PortConnector(theme, "theme");

  let display = false;
  // setTimeout(() => display = true, 5000);
  // let dark = chrome.runtime.getURL("assets/dark_channel.css")
  
  // import dark from '../assets/dark_channel.css?inline';
  let themeName = writable(true);
  import PortConnector from '../content_script/portConnector.js';

  let theme = (data) => {
      themeName = data.data;
  }
  let port = new PortConnector(theme, "theme");
import { onMount } from 'svelte';

let darkUrl = 'assets/dark_channel.css';
let lightUrl = 'assets/dark_channel.css';
let mounted = false;
onMount(() => {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    darkUrl = chrome.runtime.getURL('assets/dark_channel.css');
    lightUrl = chrome.runtime.getURL('assets/light_channel.css');
    mounted = true;
  }
});
</script>

<!-- <svelte:head>
  {#if themeName}
	<link rel="stylesheet" type="text/css" href="assets/dark_channel.css">
	{:else}
	<link rel="stylesheet" type="text/css" href="assets/dark_channel.css">
	{/if}
</svelte:head> -->
<!-- <svelte:head>
  {#if $themeName && mounted}
	<link rel="stylesheet" type="text/css"  href={darkUrl}>
	{:else if mounted}
	<link rel="stylesheet" type="text/css"  href={lightUrl}>
	{/if}
</svelte:head> -->
<div id="display-container" class="display-wrapper">
  {#if $selectedConfig && Object.getOwnPropertyNames($selectedConfig).length > 0 && $channelsPickRef?.length > 0}
    <Display listId={"rootList"} bind:channelConfig={selectedConfig} bind:channelRef={channelsPickRef} />
  {:else}
    <WaitingConfig />
  {/if}
</div>

<style>
  .display-wrapper {
    margin-top: 5px;
    /* height: 100vh; */
  }
</style>