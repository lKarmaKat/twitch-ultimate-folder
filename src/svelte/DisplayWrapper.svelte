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
  let currentConfig = c.selectedConfig; // = writable({
  let selectedConfig = c.selectedConfig;
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
  let theme = true;
  import PortConnector from '../content_script/portConnector.js';

  let themeCb = (data) => {
    theme = data.data;
  }
  let port = new PortConnector(themeCb, "theme");
</script>

<div id="display-container" class="display-wrapper" class:dark={theme} class:light={!theme}>
  {#if $selectedConfig && Object.getOwnPropertyNames($selectedConfig).length > 0 && $channelsPickRef?.length > 0}
    <Display 
    listId={"rootList"} 
    channelConfig={selectedConfig} 
    channelRef={channelsPickRef}/>
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