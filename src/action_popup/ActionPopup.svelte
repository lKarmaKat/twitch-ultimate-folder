<script>
  import * as CST from '../constantes.js';
  import { _, locale } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { applyLocale } from '../i18n/index.js';
  import LanguageSelect from '../svelte/components/LanguageSelect.svelte';
  import enFlag from '../assets/flags/en.svg';
  import frFlag from '../assets/flags/fr.svg';

  // 'loading' | 'auth' | 'config'  (remplace le jonglage de l'attribut `hidden`)
  let view = $state('loading');

  // Langue courante (initialisée depuis svelte-i18n, déjà configuré par setupI18n).
  let lang = $state(get(locale) ?? 'en');
  const languages = [
    { id: 'en', name: 'English', flag: enFlag },
    { id: 'fr', name: 'Français', flag: frFlag },
  ];

  // Code d'activation Twitch (device flow)
  let userCode = $state('');
  let verificationUri = $state('');

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
    if (response?.user_code) {
      userCode = response.user_code;
      verificationUri = response.verification_uri;
      view = 'auth';
    } else {
      view = 'config';
    }
  });

  // --- Actions ---
  function openConfigPopup() {
    chrome.runtime.sendMessage({ type: CST.DISPLAY_POPUP });
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
  {:else if view === 'auth'}
    <div class="auth-container">
      <div class="auth-flex">
        <svg width="32px" height="32px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="auth-icon">
          <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.25C17.25 21.15 21 16.25 21 11V5L12 1z" />
        </svg>
        <p class="auth-title">{$_('actionPopup.authTitle')}</p>
        <p class="auth-instruction">{$_('actionPopup.authInstructionBefore')} <strong>twitch.tv/activate</strong> {$_('actionPopup.authInstructionAfter')}</p>
        <a class="auth-code" href={verificationUri} target="_blank" rel="noopener noreferrer">{userCode}</a>
        <p class="auth-waiting">{$_('actionPopup.authWaiting')}</p>
      </div>
    </div>
  {:else}
    <div class="config-container">
      <div class="popup">
        <div class="card">
          <div class="card-header">
            <h1>{$_('actionPopup.preferences')}</h1>
          </div>

          <div class="row">
            <div class="row-info">
              <button class="btn btn-primary" onclick={openConfigPopup}>{$_('actionPopup.openConfig')}</button>
            </div>
          </div>

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
    padding: 14px 16px 10px;
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
  }

  .card-header h1 {
    font-size: 17px;
    font-weight: 600;
    color: #1c1c1e;
    letter-spacing: -0.01em;
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

  /* ——— Auth (device code) ——— */
  .auth-flex {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px 12px;
    gap: 8px;
    text-align: center;
  }

  .auth-icon {
    flex-shrink: 0;
    fill: #7b3fc9;
  }

  .auth-title {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }

  .auth-instruction {
    margin: 0;
    font-size: 12px;
    opacity: 0.85;
  }

  .auth-code {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-decoration: none;
    cursor: pointer;
    background: #f0e6ff;
    color: #7b3fc9;
    border: 1px solid #7b3fc9;
  }

  .auth-waiting {
    margin: 0;
    font-size: 11px;
    opacity: 0.6;
  }

  .auth-flex p,
  .auth-flex strong {
    color: black;
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

  .app.dark .sw .track {
    background: #39393d;
  }

  .app.dark .auth-flex p,
  .app.dark .auth-flex strong {
    color: #f2f2f7;
  }

  .app.dark .auth-code {
    background: #3a2d52;
    color: #cbb6ff;
    border-color: #7b3fc9;
  }

  .app.dark .auth-icon {
    fill: #a970ff;
  }
</style>
