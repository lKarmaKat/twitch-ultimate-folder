<script>
  import * as CST from '../../constantes.js';
  import { _, locale } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { applyLocale } from '../../i18n/index.js';
  import { LANGUAGES } from '../../i18n/languages.js';
  import LanguageSelect from './LanguageSelect.svelte';
  import PortConnector from '../portConnector.svelte';

  // Thème : le service worker pousse l'état courant des la connexion du port
  // (sendCurrentThemeOnConnect), puis rediffuse chaque bascule a chaud.
  let darkTheme = $state(true);
  let themePort = new PortConnector((msg) => { darkTheme = msg.data; }, "theme");

  // Langue : meme mecanisme. On resynchronise aussi `lang` pour que le select
  // suive un changement venu d'ailleurs (action popup).
  let lang = $state(get(locale) ?? 'en');
  let localePort = new PortConnector((msg) => {
    applyLocale(msg.data);
    if (msg.data) lang = msg.data;
  }, "locale");

  function onLocaleChange() {
    // Persistance + diffusion en direct aux autres pages via le background.
    chrome.runtime.sendMessage({ type: CST.CHANGE_LOCALE, value: lang });
    applyLocale(lang);
  }

  // Sommaire ecrit a la main : ces ids doivent correspondre aux ancres posees
  // sur les titres du contenu. Le tableau ne sert qu'au controle des ancres
  // orphelines en dev.
  const IDS = [
    'purpose',
    'hierarchy',
    'sorting',
    'outside',
    'create-config',
    'open-window',
    'sections',
    'sec-channels',
    'sec-config',
    'sec-pannel',
    'sec-preview',
    'saving',
  ];

  // Garde-fou du sommaire manuel : une ancre sans cible ne provoque aucune
  // erreur au runtime, on la signale donc au moins en dev.
  $effect(() => {
    if (!import.meta.env.DEV) return;
    for (const id of IDS) {
      if (!document.getElementById(id)) console.warn('[help] ancre orpheline :', id);
    }
  });
</script>

<svelte:head>
  <title>{$_('help.pageTitle')}</title>
  {#if darkTheme}
    <link rel="stylesheet" href="/assets/sombre.css">
  {:else}
    <link rel="stylesheet" href="/assets/clair.css">
  {/if}
</svelte:head>

<div class="help-layout" class:dark={darkTheme}>
  <aside class="sidebar">
    <div class="lang-wrap">
      <LanguageSelect bind:value={lang} options={LANGUAGES} onchange={onLocaleChange} dark={darkTheme}/>
    </div>

    <nav class="toc" aria-label={$_('help.tocTitle')}>
      <p class="toc-title">{$_('help.tocTitle')}</p>
      <ul>
        <li>
          <a href="#purpose">{$_('help.purpose.title')}</a>
          <ul>
            <li><a href="#hierarchy">{$_('help.purpose.hierarchyTitle')}</a></li>
            <li><a href="#sorting">{$_('help.purpose.sortingTitle')}</a></li>
            <li><a href="#outside">{$_('help.purpose.outsideTitle')}</a></li>
          </ul>
        </li>
        <li>
          <a href="#create-config">{$_('help.createConfig.title')}</a>
          <ul>
            <li><a href="#open-window">{$_('help.createConfig.openTitle')}</a></li>
            <li>
              <a href="#sections">{$_('help.createConfig.sectionsTitle')}</a>
              <ul>
                <li><a href="#sec-channels">{$_('help.createConfig.channelsTitle')}</a></li>
                <li><a href="#sec-config">{$_('help.createConfig.currentTitle')}</a></li>
                <li><a href="#sec-pannel">{$_('help.createConfig.pannelTitle')}</a></li>
                <li><a href="#sec-preview">{$_('help.createConfig.previewTitle')}</a></li>
              </ul>
            </li>
            <li><a href="#saving">{$_('help.createConfig.savingTitle')}</a></li>
          </ul>
        </li>
      </ul>
    </nav>
  </aside>

  <main class="content">
    <h1>{$_('help.pageTitle')}</h1>

    <h2 id="purpose">{$_('help.purpose.title')}</h2>
    <p>{$_('help.purpose.intro')}</p>

    <h3 id="hierarchy">{$_('help.purpose.hierarchyTitle')}</h3>
    <p>{$_('help.purpose.hierarchy')}</p>

    <h3 id="sorting">{$_('help.purpose.sortingTitle')}</h3>
    <p>{$_('help.purpose.sorting')}</p>

    <h3 id="outside">{$_('help.purpose.outsideTitle')}</h3>
    <p>{$_('help.purpose.outside')}</p>

    <h2 id="create-config">{$_('help.createConfig.title')}</h2>

    <h3 id="open-window">{$_('help.createConfig.openTitle')}</h3>
    <p>{$_('help.createConfig.openStep1')}</p>
    <p>{$_('help.createConfig.openStep2', { values: { button: $_('actionPopup.openConfig') } })}</p>

    <!-- Exemple d'integration d'un media (voir .help-media plus bas) :
    <figure class="help-media">
      <video src="/assets/help-open-config.webm" autoplay loop muted playsinline
             aria-label={$_('help.createConfig.openMediaAlt')}></video>
      <figcaption>{$_('help.createConfig.openMediaAlt')}</figcaption>
    </figure>
    -->

    <h3 id="sections">{$_('help.createConfig.sectionsTitle')}</h3>
    <p>{$_('help.createConfig.sectionsIntro')}</p>

    <h4 id="sec-channels">{$_('help.createConfig.channelsTitle')}</h4>
    <p>{$_('help.createConfig.channels')}</p>

    <h4 id="sec-config">{$_('help.createConfig.currentTitle')}</h4>
    <p>{$_('help.createConfig.current')}</p>

    <h4 id="sec-pannel">{$_('help.createConfig.pannelTitle')}</h4>
    <p>{$_('help.createConfig.pannel')}</p>

    <h4 id="sec-preview">{$_('help.createConfig.previewTitle')}</h4>
    <p>{$_('help.createConfig.preview')}</p>

    <h3 id="saving">{$_('help.createConfig.savingTitle')}</h3>
    <p class="callout">{$_('help.createConfig.saving')}</p>
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: Roobert, Tajawal, Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
  }

  .help-layout {
    /* Palette claire par defaut, surchargee par .dark ci-dessous. */
    --help-bg: #ffffff;
    --help-fg: rgb(14, 14, 16);
    --help-muted: rgb(83, 83, 95);
    --help-accent: rgb(92, 22, 197);
    --help-sidebar-bg: #f7f7f8;
    --help-border: #d8d8de;
    --help-hover: rgba(145, 71, 255, 0.12);

    display: grid;
    grid-template-columns: minmax(200px, 280px) 1fr;
    height: 100vh;
    /* Le parent ne scrolle jamais : chaque colonne gere son propre debordement. */
    overflow: hidden;
    background-color: var(--help-bg);
    color: var(--help-fg);
  }

  .help-layout.dark {
    --help-bg: #18181b;
    --help-fg: rgb(239, 239, 241);
    --help-muted: rgb(173, 173, 184);
    --help-accent: rgb(191, 148, 255);
    --help-sidebar-bg: #0e0e10;
    --help-border: #35353b;
    --help-hover: rgba(145, 71, 255, 0.22);
  }

  /* ---- Colonne de gauche ---- */
  .sidebar {
    overflow-y: auto;
    height: 100vh;
    box-sizing: border-box;
    padding: 1.5em 1em;
    background-color: var(--help-sidebar-bg);
    border-right: 1px solid var(--help-border);
  }
  .lang-wrap {
    margin-bottom: 1.5em;
  }

  /* ---- Sommaire ---- */
  .toc-title {
    margin: 0 0 0.8em 0;
    font-size: 0.8em;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--help-muted);
  }
  .toc ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  /* Une seule regle couvre toute la profondeur d'imbrication. */
  .toc ul ul {
    padding-left: 1.2em;
  }
  .toc a {
    display: block;
    padding: 0.3em 0.5em;
    border-radius: 0.3em;
    font-size: 0.92em;
    line-height: 1.35;
    color: var(--help-fg);
    text-decoration: none;
  }
  .toc a:hover {
    background-color: var(--help-hover);
  }

  /* ---- Contenu ---- */
  .content {
    overflow-y: auto;
    height: 100vh;
    box-sizing: border-box;
    padding: 2em 3em 6em 3em;
    scroll-behavior: smooth;
  }
  .content h1 {
    margin: 0 0 1em 0;
    font-size: 1.9em;
    color: var(--help-accent);
  }
  .content h2 {
    margin: 1.8em 0 0.6em 0;
    font-size: 1.45em;
    color: var(--help-accent);
    border-bottom: 1px solid var(--help-border);
    padding-bottom: 0.3em;
  }
  .content h3 {
    margin: 1.4em 0 0.4em 0;
    font-size: 1.15em;
  }
  .content h4 {
    margin: 1.1em 0 0.3em 0;
    font-size: 1em;
    color: var(--help-muted);
  }
  /* Evite que le titre vise se colle au bord haut lors d'un saut d'ancre. */
  .content h2,
  .content h3,
  .content h4 {
    scroll-margin-top: 1em;
  }
  .content p {
    margin: 0 0 0.8em 0;
    max-width: 70ch;
    line-height: 1.6;
  }
  .callout {
    padding: 0.8em 1em;
    border-left: 3px solid var(--help-accent);
    border-radius: 0 0.3em 0.3em 0;
    background-color: var(--help-hover);
  }

  /* ---- Medias (gif / webm / mp4) ---- */
  .help-media {
    margin: 1em 0 1.5em 0;
    max-width: 70ch;
  }
  .help-media :global(video),
  .help-media :global(img) {
    display: block;
    width: 100%;
    height: auto;
    border: 1px solid var(--help-border);
    border-radius: 0.5em;
  }
  .help-media :global(figcaption) {
    margin-top: 0.4em;
    font-size: 0.85em;
    color: var(--help-muted);
  }

  @media (max-width: 720px) {
    .help-layout {
      grid-template-columns: 1fr;
      height: auto;
      overflow: visible;
    }
    .sidebar,
    .content {
      height: auto;
      overflow: visible;
    }
    .content {
      padding: 1.5em;
    }
  }
</style>
