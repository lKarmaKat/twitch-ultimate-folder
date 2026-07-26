<script>
  import Display from './Display.svelte';
  import WaitingConfig from './WaitingConfig.svelte';
  import ConfigManager from '../configManager.svelte';
  import PortConnector from '../portConnector.svelte.js';
  import NoLiveChannels from './NoLiveChannels.svelte';
  import EmptyConfig from './EmptyConfig.svelte';
  import NeedToConnect from './NeedToConnect.svelte';
  import { alignmentLeft, portConnected } from '../event.svelte.js';
  import { hasAnyChannel, hasVisibleContent } from '../listVisibility.js';
  import PortDisconnected from './PortDisconnected.svelte';
  import { applyLocale } from '../../i18n/index.js';

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

  let localeCb = (msg) => {
    applyLocale(msg.data);
  }
  let localePort = new PortConnector(localeCb, 'locale');


  // Aucune chaine nulle part dans l'arbre : l'utilisateur n'a rien configuré.
  let configEmpty = $derived.by(() => {
    if (!configManager?.selectedConfig) return false;
    return !hasAnyChannel(configManager, 'rootList');
  })

  // Message de repli : affiché quand, et seulement quand, Display ne rendrait
  // rien. Une liste marquée "afficher même hors ligne" suffit donc à le masquer.
  let noLiveChannels = $derived.by(() => {
    if (configManager?.selectedConfig && configManager.channelsPickRef?.length > 0) {
      return !hasVisibleContent(configManager, 'rootList');
    }
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
      <NeedToConnect configManager={configManager} />
    {:else if !configManager.selectedConfig || configManager.channelsPickRefMap?.size === 0}
      <WaitingConfig />
    {:else if configEmpty}
      <EmptyConfig configManager={configManager} />
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