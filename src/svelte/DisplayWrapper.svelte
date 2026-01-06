<script>
  import Display from './Display.svelte';
  // import { ConfigManager } from './configManager';
  import ConfigManager from '../content_script/configManager';
  // import PortConnector from '../content_script/portConnector';
  import WaitingConfig from './WaitingConfig.svelte';
  import { writable } from 'svelte/store';

  // import { onMount } from 'svelte';
  // import { writable } from 'svelte/store';

  let configManager = new ConfigManager();

  let c = configManager.getConfig();
  let channelsPickRef = c.channelsPickRef;
  let channelsConfig = c.channelsConfig;

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

</script>

<!-- <svelte:head>
  {#if themeName}
  <style>
    {dark}
  </style>
	<link rel="stylesheet" type="text/css" href={dark}>
	<link rel="stylesheet" type="text/css" href="assets/dark_channel.css">
	{:else}
	<link rel="stylesheet" type="text/css" href="./assets/dark_channel.css">
	{/if}
</svelte:head> -->

{#if $channelsConfig?.rootList?.items?.length > 0 && $channelsPickRef.length}
  <div class="display-wrapper">
    <Display listId={"rootList"} bind:channelConfig={channelsConfig} bind:channelRef={channelsPickRef} />
  </div>
{:else}
  <WaitingConfig />
{/if}

<style>
  .display-wrapper {
    margin-top: 50px;
    /* height: 100vh; */
  }
</style>