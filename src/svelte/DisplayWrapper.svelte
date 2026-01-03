<script>
  import Display from './Display.svelte';
  import ConfigManager from '../content_script/configManager';
  import PortConnector from '../content_script/portConnector';
  import { writable } from 'svelte/store';

  // import { onMount } from 'svelte';
  // import { writable } from 'svelte/store';

  let configManager = new ConfigManager();

  let c = configManager.getConfig();
  let channelsPickRef = c.channelsPickRef;
  let channelsConfig = c.channelsConfig;
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

  let themeName = writable(true);

  let theme = (data) => {
      themeName = data.data;
  }
  let port = new PortConnector(theme, "theme");

</script>

<svelte:head>
  {#if themeName}
	<link rel="stylesheet" href="sombre.css">
	{:else}
	<link rel="stylesheet" href="clair.css">
	{/if}
</svelte:head>

<div class="tea">
  {#if $channelsConfig?.listeRacine?.style}
    <Display listId={"listeRacine"} bind:channelConfig={channelsConfig} bind:channelRef={channelsPickRef} />
  {/if}
</div>