<script>
  import Display from './Display.svelte';
  import WaitingConfig from './WaitingConfig.svelte';
  import ConfigManager from '../configManager.svelte';
  import PortConnector from '../portConnector.js';

  import { writable, derived } from 'svelte/store';

  let { configManager = new ConfigManager(), channelRefMap } = $props();

  let c = $derived(configManager.getConfig());
  let channelsPickRef = $derived(c.channelsPickRef);
  let channelsConfig = $derived(c.channelsConfig);
  let currentConfig = $derived(c.selectedConfig);
  let selectedConfig = $derived(c.selectedConfig);
  let theme = $state(true);

  let themeCb = (data) => {
    theme = data.data;
  }
  let port = new PortConnector(themeCb, "theme");

  let alignementLeft = $state(true);
  let alignmentCb = (data) => {
    alignementLeft = data.data
  }
  let alignmentPort = new PortConnector(alignmentCb, 'alignment');
</script>

<div id="display-container" class="display-wrapper" class:dark={theme} class:light={!theme} class:al-left={alignementLeft} class:al-right={!alignementLeft}>
  {#if $selectedConfig && Object.getOwnPropertyNames($selectedConfig).length > 0 && $channelsPickRef?.length > 0}
    <Display 
    listId={"rootList"} 
    channelConfig={selectedConfig} 
    channelRef={channelsPickRef}
    channelRefMap={channelRefMap}
    alignedLeft={alignementLeft}/>
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