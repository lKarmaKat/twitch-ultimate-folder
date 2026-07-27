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
  import { readTwitchDark, watchTwitchTheme } from '../twitchTheme.js';
  import * as CST from '../../constantes.js';

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
  // Follows Twitch's own theme: no user setting, no port, no service worker.
  let theme = $state(readTwitchDark());
  $effect(() => watchTwitchTheme((dark) => { theme = dark; }));

  // null until the service worker decides: show the waiting screen rather than
  // a bogus "logged out".
  let authState = $state(null);
  // { user_code, verification_uri } during a device flow. Broadcast to EVERY
  // Twitch tab, not only the one that clicked.
  let deviceCode = $state(null);
  // Between the click and the code: one round trip to /oauth2/device.
  let authorizing = $state(false);
  let authCb = (msg) => {
    if (msg.type === CST.AUTH_DEVICE_CODE) {
      deviceCode = msg.data;
      return;
    }
    authState = msg.data;
    // The background broadcasts a state at the end of every flow: our only
    // reset signal, without which a failed flow would freeze the UI.
    deviceCode = null;
    authorizing = false;
  }
  let authPort = new PortConnector(authCb, 'auth');

  function startAuth() {
    authorizing = true;
    authPort.send({ type: CST.START_AUTH });
  }

  let alignmentCb = (data) => {
    alignmentLeft.current = data.data;
  }
  let alignmentPort = new PortConnector(alignmentCb, 'alignment');

  let localeCb = (msg) => {
    applyLocale(msg.data);
  }
  let localePort = new PortConnector(localeCb, 'locale');


  // No channel anywhere in the tree: the user configured nothing.
  let configEmpty = $derived.by(() => {
    if (!configManager?.selectedConfig) return false;
    return !hasAnyChannel(configManager, 'rootList');
  })

  let noLiveChannels = $derived.by(() => {
    if (configManager?.selectedConfig && configManager.channelsPickRef?.length > 0) {
      return !hasVisibleContent(configManager, 'rootList');
    }
    return true;
  })

  let dataPending = $derived.by(() => {
    if (authState === null) return true;
    if (!configManager?.selectedConfig) return true;
    if (Object.getOwnPropertyNames(configManager.selectedConfig).length === 0) return true;
    return !(configManager.channelsPickRefMap?.size > 0);
  })

</script>

<div id="display-container" class="display-wrapper" class:dark={theme} class:light={!theme} class:al-left={alignmentLeft.current} class:al-right={!alignmentLeft.current}>
  <!-- Strictly false: null means "not connected yet", not a real disconnect. -->
  {#if portConnected.current === false}
    <PortDisconnected />
  {/if}

  {#if authState === CST.AUTH_NEED_AUTH}
    <NeedToConnect
      configManager={configManager}
      deviceCode={deviceCode}
      authorizing={authorizing}
      onAuthorize={startAuth} />
  {:else if authState === CST.AUTH_NO_SESSION}
    <!-- Safety net: the content script normally already handed the sidebar
         back to Twitch by flipping the container to `collapsed`. -->
  {:else if dataPending}
    {#if portConnected.current !== false}
      <WaitingConfig />
    {/if}
  {:else if configEmpty}
    <EmptyConfig configManager={configManager} />
  {:else if noLiveChannels}
    <NoLiveChannels />
  {:else}
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
  :host([collapsed]) #display-container {
    display: none;
  }
</style>