<script>
  import Display from './Display.svelte';
  import WaitingConfig from './WaitingConfig.svelte';
  import ConfigManager from '../configManager.svelte';
  import PortConnector from '../portConnector.js';

  import { writable, derived } from 'svelte/store';

  let { configManager = new ConfigManager() } = $props();

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