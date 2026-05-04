<script>
  import Display from './Display.svelte';
  import WaitingConfig from './WaitingConfig.svelte';
  import ConfigManager from '../configManager';
  import PortConnector from '../portConnector.js';

  import { writable, derived } from 'svelte/store';

  export let configManager = new ConfigManager();

  let c = configManager.getConfig();
  let channelsPickRef = c.channelsPickRef;
  let channelsConfig = c.channelsConfig;
  let currentConfig = c.selectedConfig;
  let selectedConfig = c.selectedConfig;
  let theme = true;

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