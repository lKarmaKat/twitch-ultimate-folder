<script>
  import * as CST from '../constantes.js';
  import { _, locale } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { applyLocale } from '../i18n/index.js';
  import LanguageSelect from '../svelte/components/LanguageSelect.svelte';
  import { LANGUAGES } from '../i18n/languages.js';

  // 'loading' | 'config'  (remplace le jonglage de l'attribut `hidden`)
  let view = $state('loading');

  // Langue courante (initialisée depuis svelte-i18n, déjà configuré par setupI18n).
  let lang = $state(get(locale) ?? 'en');
  const languages = LANGUAGES;

  // Ce que la premiere ligne de la carte doit proposer. Resolu depuis l'onglet
  // ACTIF : la popup peut tres bien etre ouverte depuis une page qui n'est pas
  // Twitch, ou aucun content script ne tourne.
  let authState = $state(null);
  // Le device flow vit dans la sidebar, que `:host([collapsed])` masque quand
  // la barre laterale de Twitch est repliee. Y renvoyer sans le dire serait un
  // cul-de-sac : aucune surface visible ne permettrait d'autoriser l'extension.
  let sideNavCollapsed = $state(false);

  // Toggles. `theme` true = thème sombre (cohérent avec la popup de config).
  let theme = $state(false);
  let alignment = $state(true);

  // --- Initialisation (équivalent du corps de l'ancien popup.js) ---
  chrome.runtime.sendMessage({ type: CST.GET_THEME }, (response) => {
    if (response?.type === CST.THEME) {
      theme = response.data;
    }
  });

  chrome.runtime.sendMessage({ type: CST.GET_ALIGNMENT }, (response) => {
    if (response?.type === CST.ALIGNMENT) {
      alignment = !response.data;
    }
  });

  chrome.runtime.sendMessage({ type: CST.IS_USER_LOGGED_IN }, (response) => {
    authState = response?.state ?? CST.AUTH_NOT_ON_TWITCH;
    sideNavCollapsed = response?.sideNavCollapsed === true;
    view = 'config';
  });

  // --- Actions ---
  function openConfigPopup() {
    chrome.runtime.sendMessage({ type: CST.DISPLAY_POPUP });
  }

  // Page d'extension ouverte dans un onglet dedie.
  function openHelp() {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/iframe/help.html') });
  }

  async function onThemeChange() {
    const response = await chrome.runtime.sendMessage({ type: CST.CHANGE_THEME, value: theme });
    // !response => refus du background : on retombe sur le thème clair
    theme = response ? response.data : false;
  }

  async function onAlignmentChange() {
    // case cochée => alignement à droite (value:false) ; décochée => gauche (value:true)
    const value = !alignment;
    const response = await chrome.runtime.sendMessage({ type: CST.CHANGE_ALIGNMENT, value });
    alignment = response ? !response.data : false;
  }

  function onLocaleChange() {
    // Persistance + diffusion en direct aux onglets via le background.
    chrome.runtime.sendMessage({ type: CST.CHANGE_LOCALE, value: lang });
    applyLocale(lang);
  }
</script>

<div class="app" class:dark={theme}>
  {#if view === 'loading'}
    <div class="loader">
      <div class="loading-wrapper">
        <div class="loading-overlay"></div>
      </div>
    </div>
  {:else}
    <div class="config-container">
      <div class="popup">
        <div class="card">
          {#if authState === CST.AUTH_NEED_AUTH}
            <!-- L'autorisation se donne desormais depuis la sidebar. Plutot que
                 de loger ce renvoi dans une ligne de reglage, l'en-tete porte
                 l'etat : c'est le sujet de la popup tant qu'elle n'a rien
                 d'autre a proposer. Meme bouclier et meme composition que
                 NeedToConnect, pour que les deux surfaces se repondent. -->
            <div class="state-header">
              <button
                class="help-btn"
                onclick={openHelp}
                title={$_('help.openHelp')}
                aria-label={$_('help.openHelp')}>?</button>

              <span class="icon-plate" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.25C17.25 21.15 21 16.25 21 11V5L12 1z" />
                </svg>
              </span>

              <!-- Cle partagee avec la sidebar : meme etat, memes mots, une
                   seule verite a traduire. -->
              <p class="state-title">{$_('status.needConnect')}</p>
              <p class="state-message">
                {sideNavCollapsed ? $_('actionPopup.expandSideNav') : $_('actionPopup.seeSidebar')}
              </p>
            </div>
          {:else}
            <div class="card-header">
              <h1>{$_('actionPopup.preferences')}</h1>
              <button
                class="help-btn"
                onclick={openHelp}
                title={$_('help.openHelp')}
                aria-label={$_('help.openHelp')}>?</button>
            </div>

            <!-- Seule cette ligne depend du compte. Theme, alignement et langue
                 sont des preferences du profil navigateur et restent utilisables
                 meme hors de Twitch. -->
            <div class="row">
              <div class="row-info">
                {#if authState === CST.AUTH_READY}
                  <button class="btn btn-primary" onclick={openConfigPopup}>{$_('actionPopup.openConfig')}</button>
                {:else if authState === CST.AUTH_NO_SESSION}
                  <div class="row-notice">{$_('actionPopup.noSession')}</div>
                {:else}
                  <div class="row-notice">{$_('actionPopup.notOnTwitch')}</div>
                {/if}
              </div>
            </div>
          {/if}

          <label class="row" for="theme">
            <div class="row-info">
              <div class="row-label">{$_('actionPopup.theme')}</div>
            </div>
            <input type="checkbox" class="tgl" id="theme" bind:checked={theme} onchange={onThemeChange}>
            <span class="sw">
              <span class="track"></span>
              <span class="lbl-on">{$_('actionPopup.dark')}</span>
              <span class="lbl-off">{$_('actionPopup.light')}</span>
              <span class="thumb"></span>
            </span>
          </label>

          <label class="row" for="alignment">
            <div class="row-info">
              <div class="row-label">{$_('actionPopup.alignment')}</div>
              <div class="row-sub">{$_('actionPopup.alignmentSub')}</div>
            </div>
            <input type="checkbox" class="tgl" id="alignment" bind:checked={alignment} onchange={onAlignmentChange}>
            <span class="sw">
              <span class="track"></span>
              <span class="lbl-on">{$_('actionPopup.right')}</span>
              <span class="lbl-off">{$_('actionPopup.left')}</span>
              <span class="thumb"></span>
            </span>
          </label>

          <div class="row">
            <div class="row-info">
              <div class="row-label">{$_('actionPopup.language')}</div>
            </div>
            <div class="lang-wrap">
              <LanguageSelect bind:value={lang} options={languages} onchange={onLocaleChange} dark={theme}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    width: 320px;
    margin: 0;
  }

  .app {
    width: 320px;
    background: #f2f2f7;
  }

  /* ——— Popup config ——— */
  .popup {
    width: 320px;
    background: #f2f2f7;
    display: flex;
    flex-direction: column;
  }

  .card {
    margin: 16px 12px 8px;
    background: #ffffff;
    border-radius: 14px;
    /* overflow: hidden; */
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 14px 16px 10px;
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
  }

  .help-btn {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: #9147ff;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
  }

  .help-btn:hover {
    background: #772ce8;
  }

  .card-header h1 {
    font-size: 17px;
    font-weight: 600;
    color: #1c1c1e;
    letter-spacing: -0.01em;
  }

  /* ——— En-tête d'état (autorisation requise) ———
     Remplace .card-header : le message est le titre de la popup, pas une ligne
     dedans. Le bouton d'aide sort du flux pour que la colonne reste centrée
     sur l'icône et le texte. */
  .state-header {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 18px 16px 16px;
    text-align: center;
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
  }

  .state-header .help-btn {
    position: absolute;
    top: 12px;
    right: 12px;
  }

  .icon-plate {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    /* Violet translucide : lisible sur les deux fonds, rien à faire varier. */
    background: rgba(145, 71, 255, 0.16);
  }

  .icon-plate svg {
    width: 22px;
    height: 22px;
    fill: #7b3fc9;
  }

  .state-title {
    margin: 0;
    font-size: 15px;
    font-weight: 650;
    color: #1c1c1e;
    letter-spacing: -0.01em;
  }

  .state-message {
    margin: 0;
    max-width: 240px;
    font-size: 13px;
    line-height: 1.42;
    color: #56525f;
    text-wrap: balance;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    gap: 12px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .row:active {
    background: #f2f2f7;
  }

  .row:not(:last-child) {
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
  }

  .row-info {
    flex: 1;
  }

  .row-label {
    font-size: 14px;
    font-weight: 400;
    color: #1c1c1e;
  }

  .row-sub {
    font-size: 12px;
    color: #8e8e93;
    margin-top: 2px;
  }

  /* Message d'attente (pas sur Twitch / pas connecte) : occupe la place du
     bouton, sans en avoir l'apparence cliquable. */
  .row-notice {
    font-size: 13px;
    line-height: 1.4;
    color: #8e8e93;
    text-wrap: balance;
  }

  .lang-wrap {
    width: 140px;
    flex-shrink: 0;
    font-size: 13px;
  }

  /* ——— Toggle ——— */
  input[type="checkbox"].tgl {
    display: none;
  }

  .sw {
    position: relative;
    width: 64px;
    height: 30px;
    flex-shrink: 0;
    cursor: pointer;
  }

  .sw .track {
    position: absolute;
    inset: 0;
    border-radius: 30px;
    background: #e5e5ea;
    transition: background 0.25s ease;
  }

  .sw .lbl-off {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    font-weight: 600;
    color: #8e8e93;
    letter-spacing: 0.03em;
    pointer-events: none;
    transition: opacity 0.2s;
    z-index: 1;
  }

  .sw .lbl-on {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.03em;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 1;
  }

  .sw .thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.22), 0 0.5px 1px rgba(0, 0, 0, 0.1);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 2;
  }

  input[type="checkbox"].tgl:checked + .sw .track {
    background: #34c759;
  }

  input[type="checkbox"].tgl:checked + .sw .thumb {
    transform: translateX(34px);
  }

  input[type="checkbox"].tgl:checked + .sw .lbl-off {
    opacity: 0;
  }

  input[type="checkbox"].tgl:checked + .sw .lbl-on {
    opacity: 1;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 16px;
    border-radius: 10px;
    border: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    white-space: nowrap;
    background: rgb(92, 22, 197);
    color: #e2dfdf;
  }

  .btn:active {
    transform: scale(0.97);
    opacity: 0.85;
  }

  .btn:disabled {
    opacity: 0.55;
    cursor: default;
  }

  .btn-primary:hover {
    opacity: 0.88;
  }

  /* ——— Loader ——— */
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
      conic-gradient(#0000 10%, #000),
      linear-gradient(#000 0 0) content-box;
    -webkit-mask: var(--_m);
    mask: var(--_m);
    -webkit-mask-composite: source-out;
    mask-composite: subtract;
    animation: l3 1s infinite linear;
  }

  @keyframes l3 {
    to {
      transform: rotate(1turn);
    }
  }

  /* ——— Thème sombre (activé par le toggle, cohérent avec la popup de config) ——— */
  :global(body):has(.app.dark),
  .app.dark {
    background: #1c1c1e;
  }

  .app.dark .popup {
    background: #1c1c1e;
  }

  .app.dark .card {
    background: #2c2c2e;
  }

  .app.dark .card-header {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .app.dark .card-header h1 {
    color: #f2f2f7;
  }

  .app.dark .state-header {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .app.dark .icon-plate svg {
    fill: #a970ff;
  }

  .app.dark .state-title {
    color: #f2f2f7;
  }

  .app.dark .state-message {
    color: #b0adb8;
  }

  .app.dark .row:active {
    background: #3a3a3c;
  }

  .app.dark .row:not(:last-child) {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }

  .app.dark .row-label {
    color: #f2f2f7;
  }

  .app.dark .row-sub {
    color: #98989f;
  }

  .app.dark .row-notice {
    color: #98989f;
  }

  .app.dark .sw .track {
    background: #39393d;
  }
</style>
