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
  let theme = $state(true);
  let themeCb = (data) => {
    theme = data.data;
  }
  let port = new PortConnector(themeCb, "theme");

  // null tant que le service worker n'a pas tranché : on affiche l'écran
  // d'attente plutôt qu'un faux « non connecté ».
  let authState = $state(null);
  // { user_code, verification_uri } pendant un device flow. Diffusé à TOUS les
  // onglets Twitch, pas seulement à celui d'où part le clic.
  let deviceCode = $state(null);
  // Entre le clic et l'arrivée du code : un aller-retour vers /oauth2/device.
  let authorizing = $state(false);
  let authCb = (msg) => {
    if (msg.type === CST.AUTH_DEVICE_CODE) {
      deviceCode = msg.data;
      return;
    }
    authState = msg.data;
    // Le background diffuse un état à la fin de chaque flow — READY en cas de
    // succès, NEED_AUTH en cas d'échec ou d'expiration. C'est notre unique
    // signal de remise à zéro : sans lui, un flow échoué laisserait un code
    // périmé à l'écran et un bouton désactivé pour toujours.
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


  // Aucune chaine nulle part dans l'arbre : l'utilisateur n'a rien configuré.
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
  {#if portConnected.current === false} // false in case of a real disconnect
    <PortDisconnected />
  {/if}

  {#if authState === CST.AUTH_NEED_AUTH}
    <NeedToConnect
      configManager={configManager}
      deviceCode={deviceCode}
      authorizing={authorizing}
      onAuthorize={startAuth} />
  {:else if authState === CST.AUTH_NO_SESSION}
    <!-- Filet de sécurité : le content script a normalement déjà rendu la
         sidebar à Twitch en repassant le conteneur en `collapsed`. -->
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