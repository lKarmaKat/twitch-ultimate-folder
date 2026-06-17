<script>
  import Display from './Display.svelte';
  import WaitingConfig from './WaitingConfig.svelte';
  import ConfigManager from '../configManager.svelte';
  import PortConnector from '../portConnector.svelte.js';
  import NoLiveChannels from './NoLiveChannels.svelte';
  import { alignmentLeft, portConnected } from '../event.svelte.js';
  import * as CST from '../../constantes'
  import PortDisconnected from './PortDisconnected.svelte';

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

  let isUserConnected = $state(null);
  let authCb = (msg) => {
    isUserConnected = msg.data;
  }
  let authPort = new PortConnector(authCb, 'auth');

  let alignmentCb = (data) => {
    alignmentLeft.current = data.data;
  }
  let alignmentPort = new PortConnector(alignmentCb, 'alignment');


function checkForLiveChannelInList(listId) {
  const items = configManager?.selectedConfig?.[listId]?.items;
  
  if (!items || items.length === 0) {
    return false;
  }
  
  for (let currentChannel of items) {
    if (currentChannel.type === CST.TYPE_LIST) {
      // console.log("checkingList for", currentChannel.id);
      if (checkForLiveChannelInList(currentChannel.id)) {
        return true; // Sortie anticipée
      }
    }
    else if (currentChannel.channel_id === CST.ALL_OTHER_CHANNELS) {
        return true;
    }
    else if (currentChannel.channel_id) {
      const channelInfo = configManager.channelsPickRefMap?.get(currentChannel.channel_id);
      if (!channelInfo) {
        // console.warn("Channel not found in map:", currentChannel.channel_id);
        continue;
      }
      if (channelInfo.isLive) {
        return true;
      }
    }
  }
  
  return false;
}

  let noLiveChannels = $derived.by(() => {
    // console.log("+++ start noLiveChannels")
    if (configManager?.selectedConfig && configManager.channelsPickRef?.length > 0) {
      let result = checkForLiveChannelInList('rootList');
      // console.log("--- final result ", result)
      return !result;
    }
    // console.log("--- default true noLiveChannels");
    return true;
  })

let shortLoadingLogo = $state(true)
setTimeout(()=> shortLoadingLogo = false, 200);

</script>

<div id="display-container" class="display-wrapper" class:dark={theme} class:light={!theme} class:al-left={alignmentLeft.current} class:al-right={!alignmentLeft.current}>
  {#if shortLoadingLogo}
    <WaitingConfig />
  {:else}
    {#if !portConnected.current}
      <PortDisconnected />
    {/if}
    {#if !isUserConnected}
      Seems like you need to connect
    {:else if !configManager.selectedConfig || configManager.channelsPickRefMap?.size === 0}
      <WaitingConfig />
    {:else if noLiveChannels}
      <NoLiveChannels />
    {:else if configManager.selectedConfig && Object.getOwnPropertyNames(configManager.selectedConfig).length > 0 && configManager.channelsPickRefMap?.size > 0}
      <Display 
      listId={"rootList"}
      configManager={configManager}/>
    {/if}
  {/if}
</div>

<style>
  .display-wrapper {
    margin-top: 5px;
    /* height: 100vh; */
  }
  :host([collapsed]) #display-container {
    display: none;
  }
</style>