<script>
  import ConfigList from './ConfigList.svelte';
  import ConfigPannel from './ConfigPannel.svelte'
  import MainChannelsList from './MainChannelsList.svelte';
  import Display from './Display.svelte';
  import DraggableChannel from './DraggableChannel.svelte';
  import DisplayWrapper from './DisplayWrapper.svelte';
  import ConfigManager from '../configManager.svelte';
  import PortConnector from '../portConnector.svelte';
  import {  STARTUP_CONF } from '../../constantes.js'
  import { _ } from 'svelte-i18n';
  import { applyLocale } from '../../i18n/index.js';
  import { writable, derived, get } from 'svelte/store';
  

  let configManager = new ConfigManager();
  let loading = $derived.by(() => {
    return !(configManager.channelsPickRef.length > 1 && configManager.channelsConfigList && Object.getOwnPropertyNames(configManager.channelsConfigList).length > 0)
  })


  function showDisplayConf() {
    console.log("display", configManager.channelsConfigList);
  }
  function closePopup() {
    chrome.runtime.sendMessage({type: 'HIDE_POPUP'});
  }

  // Page d'extension ouverte dans un onglet dedie : pas besoin de la declarer
  // dans web_accessible_resources, l'appel part deja d'un contexte extension.
  function openHelp() {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/iframe/help.html') });
  }

  let showResetConfirm = $state(false);

  function promptResetConfig(param) {
      showResetConfirm = true;

    // let confName = configManager.selectedConfig[param].name;
    // let promptMsg = get(_)('configPopup.resetPrompt', { values: { name: confName } });
    // let promptMsg = $_('configPopup.resetPrompt');
    // let rep = prompt(promptMsg, "oui");
    // if (rep === "oui") {
    //   configManager.resetConfig()
    // }
  }
  function confirmReset() {
  configManager.resetConfig();
  showResetConfirm = false;
}
  function saveConfig() {
    configManager.saveConfig(configManager.selectedConfig);
  }

  let darkTheme = $state(true);

  let theme = (data) => {
      darkTheme = data.data;
  }
  let port = new PortConnector(theme, "theme");

  let localeCb = (msg) => {
      applyLocale(msg.data);
  }
  let localePort = new PortConnector(localeCb, "locale");

  // Ca je garde au cas où
  // function newConfig() {
  //   let newConfigName = "newConfig";
  //   let newConfigIndex = 1;
  //   let configExist;
  //   // do {
  //   //   configExist = $channelsConfig.configsList.find(e => e.rootList.name === newConfigName + newConfigIndex);
  //   //   if (!configExist) {
  //   //     let newConfig = structuredClone(STARTUP_CONF)
  //   //     newConfig.rootList.name = newConfigName + newConfigIndex;
  //   //     channelsConfig.update(e => {
  //   //       e.configsList.push(newConfig);
  //   //       return e;
  //   //     })
  //   //   currentConfig.set(newConfigName + newConfigIndex);
  //   //   }
  //   //   newConfigIndex++;
  //   // } while (configExist);
    
    
  // }

  // function selectConfig(configName) {
  //   currentConfig.set(configName);
  //   console.log(configName);
  // }
  function addRootNodeFromConfigList() {
    console.log("T'as bien cliqué");
    addRootNode();
  }
  let addRootNode = $state();
</script>

<svelte:head>
  {#if darkTheme}
	<link rel="stylesheet" href="/assets/sombre.css">
	<link rel="stylesheet" href="/assets/dark_channel.css">
	{:else}
	<link rel="stylesheet" href="/assets/clair.css">
	<link rel="stylesheet" href="/assets/dark_channel.css">
	{/if}
</svelte:head>

<div class="overlay-side">
  <div class="popup">
    <div class="header">
      <div class="left">{$_('configPopup.title')}</div>
      <div class="right">
        <button onclick={() => openHelp()} class="close-btn" title={$_('help.openHelp')} aria-label={$_('help.openHelp')}>?</button>
        <button onclick={() => closePopup()} class="close-btn cross">X</button>
      </div>
    </div>
    <div class="main">
      {#if showResetConfirm}
        <div
          class="reset-confirm-overlay"
          role="presentation"
          onclick={() => (showResetConfirm = false)}
          onkeydown={(e) => e.key === 'Escape' && (showResetConfirm = false)}>
          <div
            class="confirm-modal"
            id="reset-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-confirm-title"
            tabindex="-1"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
          >
            <div class="confirm-modal-header">
              <button
                id="reset-confirm-close"
                class="close-btn cross"
                aria-label={$_('configPopup.cancel')}
                onclick={() => (showResetConfirm = false)}
              >X</button>
            </div>

            <p id="reset-confirm-title" class="confirm-text">{$_('configPopup.resetPrompt')}</p>

            <div class="confirm-actions">
              <button id="reset-confirm-yes" class="reset-btn bottom-btn" onclick={confirmReset}>
                {$_('configPopup.reset')}
              </button>
              <button id="reset-confirm-no" class="save-btn bottom-btn" onclick={() => (showResetConfirm = false)}>
                {$_('configPopup.cancel')}
              </button>
            </div>
          </div>
        </div>
      {/if}
      {#if loading}
      <div class="loading-wrapper">
        <div class="loading-overlay"></div>
      </div>
      {:else}
        <!-- <div class="flex-config">
          <div class="left">
          </div>
          <div class="right">
            {#if configManager.channelsConfigList.length > 0}
            <div class="configs-container">
              <button onclick={newConfig}>
                +
              </button>
              {#each configManager.channelsConfigList as conf(conf.rootList.name)}
                <button onclick={() => { selectConfig(conf.rootList.name) }}>
                  {conf.rootList.name}
                </button>
              {/each}
            </div>
            {:else}
              <p>No configs {configManager.channelsConfigList?.length}</p>
            {/if}
          </div>
        </div> -->
        <div class="content-column">
          <div class="flex-container">
            <div class="channels-ref-container col">
              <h2 class="section-name">{$_('configPopup.channelsList')}</h2>
              <div class="channels-container">
                {#if configManager.channelsPickRef.length > 0}
                <MainChannelsList items={configManager.channelsPickRef}/>
                {/if}
              </div>
            </div>
            {#if configManager.channelsPickRef.length}
            <div class="config-list-container col">
              <div class="header-row-flex">
                <h2 class="section-name">{$_('configPopup.configList')}</h2>
                <button 
                  id="add-root-list"
                  class="root-list-btn help-badge"
                  onclick={addRootNodeFromConfigList}
                  data-tooltip={$_('configPopup.addNewListToRoot')}><strong>+</strong></button>
              </div>
              <div id="config-list" class="channels-container">
                <ConfigList listId="rootList"
                configManager={configManager}
                requestDeleteToParent={promptResetConfig} 
                bind:addRootNode={addRootNode}/>
              </div>
            </div>
            {/if}
            <div class="config-pannel-container col">
              <div class="section-name" aria-hidden="true">&nbsp;</div>
              <div class="pannel-scroll">
                <ConfigPannel configManager={configManager} />
              </div>
            </div>
            <!-- {#if !loading} -->
            {#if configManager.channelsPickRef.length && Object.getOwnPropertyNames(configManager.channelsConfigList).length > 0}
            <div class="display-column col">
              <h2 class="section-name">{$_('configPopup.display')}</h2>
              <div id="display-container" class="display-container">
                <DisplayWrapper configManager={configManager} />
              </div>
            </div>
            {/if}
          </div>
          {#if configManager.channelsPickRef.length}
          <div class="footer-bar">
            <button id="reset-btn" class="reset-btn bottom-btn" onclick={() => promptResetConfig()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 6h18"/>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              {$_('configPopup.reset')}
            </button>
            <button class="save-btn bottom-btn" onclick={() => saveConfig()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <path d="M17 21v-8H7v8M7 3v5h8"/>
              </svg>
              {$_('configPopup.save')}
            </button>
          </div>
          {/if}
        </div>
        <!-- For debug purpose -->
        <!-- <button id="showC" onclick={showDisplayConf}>Show display conf</button> -->
      {/if}
    </div>
  </div>
</div>


<style>
  .loading-wrapper {
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .loading-overlay {
    width: 120px;
    padding: 16px;
    aspect-ratio: 1;
    border-radius: 50%;
    background: #a970ff;
    --_m: 
      conic-gradient(#0000 10%,#000),
      linear-gradient(#000 0 0) content-box;
    -webkit-mask: var(--_m);
            mask: var(--_m);
    -webkit-mask-composite: source-out;
            mask-composite: subtract;
    animation: l3 1s infinite linear;
  }
  @keyframes l3 {to{transform: rotate(1turn)}}
  .allOthers {
    width: 100%;
    height: 30px;
    border: 1px solid grey;
  }
  .header {
    /* color: rgb(191, 148, 255); */
    /* background-color: rgb(24, 24, 27); */
    width: 100%;
    height: 2.5em;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: .8em;
  }

  div.overlay-side {
    position: fixed;
    display: block;
    width: 100%;
    height: 100%;
    padding: 10px;
    background-color: rgba(20, 20, 20, 0.5);
  }
  div.popup {
    position: fixed;
    font-family: sans-serif;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    /* background-color: rgb(57, 57, 65); */
    /* background-color: rgba(30, 41, 40, 1); */
    width: 70%;
    height: 80%;
    left: 15%;
    top: 10%;
  }
  .channels-ref-container {
    flex: 1 1 14%;
  }
  .config-list-container {
    display: flex;
    flex-direction: column;
    max-height: 100%;
    flex: 1 0 14%;
  }
  #config-list {
    flex: 1 1 auto;
    min-height: 0;
  }

  div.config-pannel-container {
    flex: 3.5 0 24rem;
    width: 24rem;
  }
  div.display-column {
    display: flex;
    flex-direction: column;
    flex: 0 0 24rem;
    max-height: 100%;
  }
  div.display-container {
    min-height: 0;
    overflow-y: scroll;
    flex: 1 1 auto;
  }
  .col {
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    margin-right: 1em;
  }
  div.channels-container,
  .pannel-scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    max-height: 100%;
  }
  .pannel-scroll {
    overflow-y: auto;
    overflow-x: hidden;
  }
  .main {
    display: flex;
    flex-direction: column;
    justify-content: start;
    height: 100%;
    padding-top: 0.75em;
    padding-bottom: 3em;
    padding-left: 2em;
    /* border: 1px solid red; */
  }
  .content-column {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  div.flex-container {
    display: flex;
    flex-direction: row;
    flex: 1 1 auto;
    min-height: 0;
    
  }
  .footer-bar {
    display: flex;
    justify-content: flex-end;
    flex: 0 0 auto;
    padding: 1em 1.5em 1.2em 0;
  }
  .flex-config {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  .close-btn,
  .bottom-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    width: auto;
    padding: 0.6em 1.5em;
    font-weight: 600;
    font-size: 0.95em;
    color: #fff;
    border: none;
    border-radius: 0.625em;
    /* box-shadow: 0 3px 12px rgba(122, 61, 255, 0.45); */
    cursor: pointer;
    transition: box-shadow 0.15s ease, transform 0.1s ease;
  }
  .root-list-btn {
    padding: 1.1em 1.9em;
    border: none;
    border-radius: 0.625em;
  }
  .root-list-btn,
  .close-btn,
  .save-btn {
    background: linear-gradient(135deg, #a970ff, #7a3dff);
  }
  .close-btn {
    padding: 0.4em 0.8em;
    margin: 0.5em .4em .5em 0;
  }
  .reset-btn {
    background: linear-gradient(135deg, #75282d, #ee4242);;
    /* background: linear-gradient(135deg, #6d013c, #ee4242); */
    margin-right: 1em;
  }
  .reset-btn:hover,
  .save-btn:hover {
    /* box-shadow: 0 5px 18px rgba(122, 61, 255, 0.6); */
    transform: translateY(-1px);
  }
  .reset-btn:active,
  .save-btn:active {
    transform: translateY(1px);
    /* box-shadow: 0 2px 6px rgba(122, 61, 255, 0.5); */
  }
  .reset-btn svg,
  .save-btn svg {
    width: 1.05em;
    height: 1.05em;
  }

  .main .section-name {
    flex: 0 0 auto;
    margin-bottom: .5rem;
  }

  .header-row-flex {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .reset-confirm-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5); /* grise le popup, identique clair/sombre */
  }
  .confirm-modal {
    min-width: 300px;
    max-width: 90%;
    padding: 0.5em 1.5em 1.4em;
    border-radius: 0.75em;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
    font-family: sans-serif;
  }
  .confirm-modal-header {
    display: flex;
    justify-content: flex-end;
  }
  .confirm-text {
    margin: 0.25em 0 1.5em;
    text-align: center;
    line-height: 1.4;
  }
  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75em;
  }
  .confirm-actions .reset-btn {
    margin-right: 0; /* neutralise le margin-right:1em existant */
  }

</style>
