<script>
  import * as CST from '../constantes.js';
  import { _, locale } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { applyLocale } from '../i18n/index.js';
  import LanguageSelect from '../svelte/components/LanguageSelect.svelte';
  import { LANGUAGES } from '../i18n/languages.js';

  // 'loading' | 'config'  (replaces the juggling of the `hidden` attribute)
  let view = $state('loading');

  // Current language, seeded from svelte-i18n (already set up by setupI18n).
  let lang = $state(get(locale) ?? 'en');
  const languages = LANGUAGES;

  // What the card's first row offers, resolved from the ACTIVE tab: the popup
  // can be opened from a non-Twitch page, where no content script runs.
  let authState = $state(null);
  // The device flow lives in the sidebar, hidden by `:host([collapsed])`. Not
  // saying so would be a dead end: no visible surface left to authorize from.
  let sideNavCollapsed = $state(false);

  // No theme setting anymore: the popup follows Twitch, resolved from the
  // active tab. Read the OS theme now so the first paint is already right.
  let theme = $state(matchMedia('(prefers-color-scheme: dark)').matches);
  let alignment = $state(true);
  // Side the hover title pops up on: true = left. Bound straight to the toggle,
  // unlike `alignment`, whose label reads the other way round.
  let titleSideLeft = $state(false);

  // TODO: replace with the real Ko-fi account (same placeholder as HelpPage).
  const KOFI_URL = 'https://ko-fi.com/YOUR_KOFI_HANDLE';

  // --- Init (the body of the old popup.js) ---
  chrome.runtime.sendMessage({ type: CST.GET_ALIGNMENT }, (response) => {
    if (response?.type === CST.ALIGNMENT) {
      alignment = !response.data;
    }
  });

  chrome.runtime.sendMessage({ type: CST.GET_TITLE_SIDE }, (response) => {
    if (response?.type === CST.TITLE_SIDE) {
      titleSideLeft = response.data;
    }
  });

  chrome.runtime.sendMessage({ type: CST.IS_USER_LOGGED_IN }, (response) => {
    authState = response?.state ?? CST.AUTH_NOT_ON_TWITCH;
    sideNavCollapsed = response?.sideNavCollapsed === true;
    // null off Twitch: keep the OS theme.
    if (typeof response?.twitchDark === 'boolean') theme = response.twitchDark;
    view = 'config';
  });

  // --- Actions ---
  function openConfigPopup() {
    chrome.runtime.sendMessage({ type: CST.DISPLAY_POPUP });
  }

  // Extension page opened in its own tab.
  function openHelp() {
    const url = `${chrome.runtime.getURL('src/iframe/help.html')}?dark=${theme ? 1 : 0}`;
    chrome.tabs.create({ url });
  }

  async function onAlignmentChange() {
    // checked => align right (value:false); unchecked => left (value:true)
    const value = !alignment;
    const response = await chrome.runtime.sendMessage({ type: CST.CHANGE_ALIGNMENT, value });
    alignment = response ? !response.data : false;
  }

  async function onTitleSideChange() {
    const response = await chrome.runtime.sendMessage({ type: CST.CHANGE_TITLE_SIDE, value: titleSideLeft });
    if (response?.type === CST.TITLE_SIDE) titleSideLeft = response.data;
  }

  function onLocaleChange() {
    // Persist, plus live broadcast to the tabs through the background.
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
            <!-- Authorization now happens in the sidebar, so the header carries
                 the state instead of a settings row. Same shield and layout as
                 NeedToConnect, so both surfaces echo each other. -->
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

              <!-- Key shared with the sidebar: same state, same words, one
                   single string to translate. -->
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

            <!-- Only this row depends on the account. Theme, alignment and
                 language are browser-profile preferences, usable off Twitch. -->
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

          <label class="row" for="titleSide">
            <div class="row-info">
              <div class="row-label">{$_('actionPopup.titleSide')}</div>
              <div class="row-sub">{$_('actionPopup.titleSideSub')}</div>
            </div>
            <input type="checkbox" class="tgl" id="titleSide" bind:checked={titleSideLeft} onchange={onTitleSideChange}>
            <span class="sw">
              <span class="track"></span>
              <span class="lbl-on">{$_('actionPopup.left')}</span>
              <span class="lbl-off">{$_('actionPopup.right')}</span>
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

        <!-- Outside the card, so it shows in the authorization state too. Same
             string as the help page's support link: one translation, two
             surfaces. -->
        <a class="kofi" href={KOFI_URL} target="_blank" rel="noopener noreferrer">
          <span class="kofi-ico" aria-hidden="true">☕</span>{$_('help.support.link')}
        </a>
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

  /* ——— Config popup ——— */
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

  /* ——— State header (authorization required) ———
     Replaces .card-header: the message is the popup's title, not a row in it.
     The help button leaves the flow so the column stays centred. */
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
    /* Translucent purple: readable on both backgrounds, nothing to vary. */
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

  /* Waiting message (off Twitch / logged out): takes the button's place
     without looking clickable. */
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

  /* ——— Ko-fi (echoes the help page's support link) ——— */
  .kofi {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 0 12px 12px;
    padding: 9px 12px;
    border-radius: 12px;
    background: #ffffff;
    color: #7b3fc9;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.15s;
  }

  .kofi:hover {
    background: #e9e9ef;
  }

  .kofi-ico {
    font-size: 20px;
    line-height: 1;
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

  /* ——— Dark theme (follows Twitch, matching the config popup) ——— */
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

  .app.dark .kofi {
    background: #2c2c2e;
    color: #a970ff;
  }

  .app.dark .kofi:hover {
    background: #3a3a3c;
  }
</style>
