<script>
  import Display from './Display.svelte';
  import WaitingConfig from './WaitingConfig.svelte';
  import ConfigManager from '../configManager.svelte';
  import PortConnector from '../portConnector.svelte.js';
  import { alignmentLeft } from '../event';
  
  import { writable, derived } from 'svelte/store';

  let { configManager = new ConfigManager(true) } = $props();



  // let init = $state(false);
  // let startupTime;
  // let stopTime;
  // $effect(() => {
  //   configManager.startPort();
  //   init = true;
  // })
  // let portConnected = $derived.by(() => {
  //   if (init)
  //     return configManager.bridge.portConnected;
  //   else
  //     false;
  // });
  // $effect(() => {
  //   if (!startupTime && portConnected) {
  //     startupTime = new Date(Date.now());
  //     console.log("started #############################")
  //     console.log("#############################")
  //     console.log(startupTime)
  //   } else if (!portConnected && !stopTime) {
  //     stopTime  = new Date(Date.now());
  //     console.log("stopped #############################")
  //     console.log("#############################")
  //     console.log(startupTime)
  //     console.log(stopTime)
  //     console.log("#############################")
  //     console.log("#############################")
  //   }
  // })

  let theme = $state(true);
  let themeCb = (data) => {
    theme = data.data;
  }
  let port = new PortConnector(themeCb, "theme");

  let alignementLeft = $state(true);
  let alignmentCb = (data) => {
    alignementLeft = data.data
    alignmentLeft.set(data.data)
  }
  let alignmentPort = new PortConnector(alignmentCb, 'alignment');
</script>

<div id="display-container" class="display-wrapper" class:dark={theme} class:light={!theme} class:al-left={alignementLeft} class:al-right={!alignementLeft}>
  {#if configManager.selectedConfig && Object.getOwnPropertyNames(configManager.selectedConfig).length > 0 && configManager.channelsPickRef?.length > 0}
    <Display 
    listId={"rootList"}
    configManager={configManager}/>
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