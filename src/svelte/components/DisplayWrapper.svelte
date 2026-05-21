<script>
  import Display from './Display.svelte';
  import WaitingConfig from './WaitingConfig.svelte';
  import ConfigManager from '../configManager.svelte';
  import PortConnector from '../portConnector.svelte.js';
  import NoLiveChannels from './NoLiveChannels.svelte';
  import { alignmentLeft } from '../event';
  import * as CST from '../../constantes'
  
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


  function checkForLiveChannelInList(listId) {
    for (let currentChannel of configManager?.selectedConfig[listId].items) {
      if (currentChannel.type === CST.TYPE_LIST) {
        console.log("checkingList for ", currentChannel.id)
        return checkForLiveChannelInList(currentChannel.id);
      }
      else if (currentChannel.channel_id === CST.ALL_OTHER_CHANNELS) {
        return false;
      }
      else if (currentChannel.channel_id && configManager.channelsPickRefMap.has(currentChannel.channel_id)) {
        console.log("checking for channel", currentChannel.channel_id, configManager.channelsPickRefMap.get(currentChannel.channel_id).isLive)
        if (configManager.channelsPickRefMap.get(currentChannel.channel_id).isLive) {
          return false;
        }
      }
    }
    return true;
  }

  let noLiveChannels = $derived.by(() => {
    console.log("start##########")
    if (configManager?.selectedConfig && configManager.channelsPickRef?.length > 0) {
      let result = checkForLiveChannelInList('rootList');
      console.log("#####final result ", result)
      return result;
    }
    console.log("end##########")
    return true;
  })



</script>

<div id="display-container" class="display-wrapper" class:dark={theme} class:light={!theme} class:al-left={alignementLeft} class:al-right={!alignementLeft}>
  {#if !configManager.selectedConfig || configManager.channelsPickRef?.length === 0}
    <WaitingConfig />
  {:else if noLiveChannels}
    <NoLiveChannels />
  {:else if configManager.selectedConfig && Object.getOwnPropertyNames(configManager.selectedConfig).length > 0 && configManager.channelsPickRef?.length > 0}
    <Display 
    listId={"rootList"}
    configManager={configManager}/>
  {/if}
</div>

<style>
  .display-wrapper {
    margin-top: 5px;
    /* height: 100vh; */
  }
</style>