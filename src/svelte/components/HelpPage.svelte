<script>
  import * as CST from '../../constantes.js';
  import { _, locale } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
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

  // TODO placeholder : un seul clip sert pour toutes les demos. Remplacer par
  // un fichier par section (cf. README) quand les captures seront faites.
  const DEMO = '/assets/webm/Video.webm';

  const ISSUES_URL = 'https://github.com/lKarmaKat/twitch-ultimate-folder/issues/new';
  // TODO : remplacer par le vrai compte Ko-fi.
  const KOFI_URL = 'https://ko-fi.com/YOUR_KOFI_HANDLE';

  // Lightbox : `lightbox` porte la legende de la video ouverte, ou null.
  // La vignette reste figee sur sa premiere image ; seule la copie agrandie joue.
  let lightbox = $state(null);
  let lightboxVideo = $state(null);

  function openLightbox(caption) {
    lightbox = { caption };
  }

  function closeLightbox() {
    lightbox = null;
  }

  // Rembobinage explicite : `currentTime = 0` suffit sur un <video>, la ou un
  // GIF imposerait de reassigner son src.
  function replay() {
    if (!lightboxVideo) return;
    lightboxVideo.currentTime = 0;
    lightboxVideo.play();
  }

  function onKeydown(e) {
    if (lightbox && e.key === 'Escape') closeLightbox();
  }

  // Sommaire ecrit a la main : ces ids doivent correspondre aux ancres posees
  // sur les titres du contenu. Le tableau ne sert qu'au controle des ancres
  // orphelines en dev.
  const IDS = [
    'purpose',
    'hierarchy',
    'sorting',
    'outside',
    'offline',
    'connect',
    'find-icon-connect',
    'create-config',
    'open-window',
    'find-icon',
    'sections',
    'sec-channels',
    'sec-config',
    'sec-pannel',
    'sec-preview',
    'add-list',
    'remove-item',
    'rename-list',
    'list-behaviour',
    'header-icons',
    'header-badges',
    'add-channel',
    'move-item',
    'all-other',
    'saving',
    'action-popup',
    'issues',
    'support',
  ];

  // Une ancre qui pointe dans un <details> replie ne mene nulle part sur les
  // navigateurs qui ne le deplient pas d'eux-memes : on l'ouvre a la main.
  function openTargetDetails() {
    const el = document.getElementById(location.hash.slice(1));
    if (el?.tagName === 'DETAILS') el.open = true;
  }

  // Le navigateur traite le fragment d'URL au parsing du document, or
  // help_inject.js ne monte cette page qu'apres setupI18n() : a cet instant la
  // cible n'existe pas encore et le saut natif tombe dans le vide. `onhashchange`
  // ne rattrape rien non plus, il ne se declenche pas au chargement initial.
  // On rejoue donc le saut nous-memes.
  function scrollToHash() {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (!el) return;
    openTargetDetails();
    el.scrollIntoView();
  }

  onMount(() => {
    if (!location.hash) return;
    // Un frame d'attente : le DOM vient d'etre insere, la mise en page ne l'est
    // pas encore.
    requestAnimationFrame(scrollToHash);
    // Les vignettes sont en `height: auto` avec preload="metadata" : leur
    // hauteur reelle n'arrive qu'apres coup et decale tout ce qui les suit.
    // On repositionne une fois les medias mesures.
    if (document.readyState === 'complete') return;
    window.addEventListener('load', scrollToHash, { once: true });
    return () => window.removeEventListener('load', scrollToHash);
  });

  // Garde-fou du sommaire manuel : une ancre sans cible ne provoque aucune
  // erreur au runtime, on la signale donc au moins en dev.
  $effect(() => {
    if (!import.meta.env.DEV) return;
    for (const id of IDS) {
      if (!document.getElementById(id)) console.warn('[help] ancre orpheline :', id);
    }
  });
</script>

<svelte:window onkeydown={onKeydown} onhashchange={openTargetDetails} />

<svelte:head>
  <title>{$_('help.pageTitle')}</title>
  {#if darkTheme}
    <link rel="stylesheet" href="/assets/sombre.css">
  {:else}
    <link rel="stylesheet" href="/assets/clair.css">
  {/if}
</svelte:head>

<!-- Une seule definition de la vignette video : elle se repete une douzaine
     de fois, et la lightbox doit rester identique partout. -->
{#snippet media(caption)}
  <figure class="help-media">
    <button class="shot" type="button" onclick={() => openLightbox(caption)}>
      <video src={DEMO} preload="metadata" muted playsinline></video>
      <span class="shot-hint">{$_('help.media.hint')} ⤢</span>
    </button>
    <figcaption>{caption}</figcaption>
  </figure>
{/snippet}

<!-- TODO : remplacer par <img src="/assets/screenshots/…"> quand les captures
     existeront. Le bloc garde la place et le ratio en attendant. -->
{#snippet screenshot(alt, caption)}
  <figure class="help-media">
    <div class="shot-todo" role="img" aria-label={alt}>{alt}</div>
    <figcaption>{caption}</figcaption>
  </figure>
{/snippet}

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
            <li><a href="#offline">{$_('help.purpose.offlineTitle')}</a></li>
          </ul>
        </li>
        <li><a href="#connect">{$_('help.connect.title')}</a></li>
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
            <li>
              <a href="#add-list">{$_('help.createConfig.addListTitle')}</a>
              <ul>
                <li><a href="#remove-item">{$_('help.createConfig.removeTitle')}</a></li>
                <li><a href="#rename-list">{$_('help.createConfig.renameTitle')}</a></li>
                <li><a href="#list-behaviour">{$_('help.createConfig.behaviourTitle')}</a></li>
                <li><a href="#header-icons">{$_('help.createConfig.iconsTitle')}</a></li>
                <li><a href="#header-badges">{$_('help.createConfig.badgesTitle')}</a></li>
              </ul>
            </li>
            <li><a href="#add-channel">{$_('help.createConfig.addChannelTitle')}</a></li>
            <li><a href="#move-item">{$_('help.createConfig.moveTitle')}</a></li>
            <li><a href="#all-other">{$_('help.createConfig.allOtherTitle')}</a></li>
            <li><a href="#saving">{$_('help.createConfig.savingTitle')}</a></li>
          </ul>
        </li>
        <li><a href="#action-popup">{$_('help.actionPopup.title')}</a></li>
        <li><a href="#issues">{$_('help.issues.title')}</a></li>
        <li><a href="#support">{$_('help.support.title')}</a></li>
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

    <h3 id="offline">{$_('help.purpose.offlineTitle')}</h3>
    <p>{$_('help.purpose.offline')}</p>
    <p>{$_('help.purpose.offlineAlwaysShow', { values: { behaviour: $_('behaviour.showEvenIfOffline.label') } })}</p>

    <h2 id="connect">{$_('help.connect.title')}</h2>
    <p class="callout">{$_('help.connect.intro')}</p>

    <h3>{$_('help.connect.stepsTitle')}</h3>
    <ol class="defs">
      <li>{$_('help.connect.step1')}</li>
      <li>{$_('help.connect.step2')}</li>
      <li>{$_('help.connect.step3')}</li>
    </ol>
    {@render media($_('help.connect.caption'))}
    <p>{$_('help.connect.outro')}</p>

    <!-- Volontairement duplique de #find-icon : chaque section reste lisible
         seule, et c'est ici que l'utilisateur cherche l'icone en premier. -->
    <details id="find-icon-connect">
      <summary>{$_('help.createConfig.findIconTitle')}</summary>
      <div class="details-body">
        {@render media($_('help.createConfig.findIconCaption'))}
        <p>{$_('help.createConfig.findIcon')}</p>
      </div>
    </details>

    <h2 id="create-config">{$_('help.createConfig.title')}</h2>

    <h3 id="open-window">{$_('help.createConfig.openTitle')}</h3>
    <p>{$_('help.createConfig.openStep1')}</p>
    <p>{$_('help.createConfig.openStep2', { values: { button: $_('actionPopup.openConfig') } })}</p>

    <details id="find-icon">
      <summary>{$_('help.createConfig.findIconTitle')}</summary>
      <div class="details-body">
        {@render media($_('help.createConfig.findIconCaption'))}
        <p>{$_('help.createConfig.findIcon')}</p>
      </div>
    </details>

    {@render media($_('help.createConfig.openCaption'))}

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

    {@render media($_('help.createConfig.sectionsCaption'))}

    <h3 id="add-list">{$_('help.createConfig.addListTitle')}</h3>
    <p>{$_('help.createConfig.addList')}</p>
    {@render media($_('help.createConfig.addListCaption'))}

    <h4 id="remove-item">{$_('help.createConfig.removeTitle')}</h4>
    <p>{$_('help.createConfig.remove')}</p>
    {@render media($_('help.createConfig.removeCaption'))}

    <details id="rename-list">
      <summary>{$_('help.createConfig.renameTitle')}</summary>
      <div class="details-body">
        <p>{$_('help.createConfig.rename', { values: { field: $_('configPannel.listName') } })}</p>
        {@render media($_('help.createConfig.renameCaption'))}
      </div>
    </details>

    <details id="list-behaviour">
      <summary>{$_('help.createConfig.behaviourTitle')}</summary>
      <div class="details-body">
        <p>{$_('help.createConfig.behaviourIntro')}</p>
        <ul class="defs">
          <li><b>{$_('behaviour.extendedOnStartup.label')}</b> — {$_('help.createConfig.behaviourStartup')}</li>
          <li><b>{$_('behaviour.extendsOnHover.label')}</b> — {$_('help.createConfig.behaviourHover')}</li>
          <li><b>{$_('behaviour.extendsOnClick.label')}</b> — {$_('help.createConfig.behaviourClick')}</li>
          <li><b>{$_('behaviour.showEvenIfOffline.label')}</b> — {$_('help.createConfig.behaviourAlways')}</li>
        </ul>

        <h5>{$_('help.createConfig.sortModeTitle')}</h5>
        <p>
          {$_('help.createConfig.sortModeIntro', { values: {
            custom: $_('sort.custom'), viewer: $_('sort.viewer'), alpha: $_('sort.alpha')
          } })}
        </p>
        <p class="warning">{$_('help.createConfig.sortModeWarning')}</p>
        <p>{$_('help.createConfig.sortModeRule')}</p>

        {@render screenshot($_('help.createConfig.behaviourShotAlt'), $_('help.createConfig.behaviourShotCaption'))}
      </div>
    </details>

    <details id="header-icons">
      <summary>{$_('help.createConfig.iconsTitle')}</summary>
      <div class="details-body">
        <p>{$_('help.createConfig.icons1')}</p>
        <p>{$_('help.createConfig.icons2')}</p>
        <p>{$_('help.createConfig.icons3')}</p>
        {@render screenshot($_('help.createConfig.iconsShotAlt'), $_('help.createConfig.iconsShotCaption'))}
      </div>
    </details>

    <details id="header-badges">
      <summary>{$_('help.createConfig.badgesTitle')}</summary>
      <div class="details-body">
        <p>{$_('help.createConfig.badgesIntro')}</p>
        <p>{$_('help.createConfig.badgesCount')}</p>
        <ul class="defs">
          <li><b>{$_('counterType.bareCounter')}</b> — {$_('help.createConfig.badgesBare')}</li>
          <li><b>{$_('counterType.badge')}</b> — {$_('help.createConfig.badgesBadge')}</li>
          <li><b>{$_('counterType.nakedBadge')}</b> — {$_('help.createConfig.badgesNaked')}</li>
          <li><b>{$_('counterType.withTotalCount')}</b> — {$_('help.createConfig.badgesTotal')}</li>
          <li><b>{$_('counterType.withLiveIcon')}</b> — {$_('help.createConfig.badgesLiveIcon')}</li>
        </ul>
        <p>{$_('help.createConfig.badgesOutro')}</p>
        {@render screenshot($_('help.createConfig.badgesShotAlt'), $_('help.createConfig.badgesShotCaption'))}
      </div>
    </details>

    <h3 id="add-channel">{$_('help.createConfig.addChannelTitle')}</h3>
    <p>{$_('help.createConfig.addChannel')}</p>
    {@render media($_('help.createConfig.addChannelCaption'))}

    <h3 id="move-item">{$_('help.createConfig.moveTitle')}</h3>
    <p>{$_('help.createConfig.move')}</p>
    {@render media($_('help.createConfig.moveCaption'))}

    <h3 id="all-other">{$_('help.createConfig.allOtherTitle')}</h3>
    <p>{$_('help.createConfig.allOther1')}</p>
    <p>{$_('help.createConfig.allOther2')}</p>
    <ul class="defs">
      <li><b>{$_('allOtherHeader.none')}</b> — {$_('help.createConfig.allOtherNone')}</li>
      <li><b>{$_('allOtherHeader.sortable')}</b> — {$_('help.createConfig.allOtherSortable')}</li>
    </ul>
    {@render media($_('help.createConfig.allOtherCaption'))}

    <h3 id="saving">{$_('help.createConfig.savingTitle')}</h3>
    <p class="callout">{$_('help.createConfig.saving')}</p>

    <h2 id="action-popup">{$_('help.actionPopup.title')}</h2>
    <p>{$_('help.actionPopup.intro')}</p>

    <h3>{$_('actionPopup.theme')}</h3>
    <p>{$_('help.actionPopup.theme')}</p>
    {@render media($_('help.actionPopup.themeCaption'))}

    <h3>{$_('actionPopup.alignment')}</h3>
    <p>{$_('help.actionPopup.alignment')}</p>
    {@render media($_('help.actionPopup.alignmentCaption'))}

    <h3>{$_('actionPopup.language')}</h3>
    <p>{$_('help.actionPopup.language')}</p>
    {@render media($_('help.actionPopup.languageCaption'))}

    <h2 id="issues">{$_('help.issues.title')}</h2>
    <p>
      {$_('help.issues.intro')}
      <a class="link" href={ISSUES_URL} target="_blank" rel="noopener noreferrer">{$_('help.issues.link')}</a>
    </p>
    <p>{$_('help.issues.listIntro')}</p>
    <ul class="defs">
      <li>{$_('help.issues.expected')}</li>
      <li>{$_('help.issues.steps')}</li>
      <li>{$_('help.issues.browser')}</li>
      <li>{$_('help.issues.reload')}</li>
    </ul>
    <p>{$_('help.issues.logsIntro')}</p>
    <ul class="defs">
      <li>{$_('help.issues.logsPage')}</li>
      <li>{$_('help.issues.logsWorker')}</li>
    </ul>
    <p>{$_('help.issues.recording')}</p>

    <h2 id="support">{$_('help.support.title')}</h2>
    <p>{$_('help.support.text')}</p>
    <p>
      <a class="kofi" href={KOFI_URL} target="_blank" rel="noopener noreferrer">☕ {$_('help.support.link')}</a>
    </p>
  </main>
</div>

{#if lightbox}
  <div class="lb">
    <!-- Le fond est un bouton : il ferme au clic et reste atteignable au clavier. -->
    <button class="lb-backdrop" type="button" aria-label={$_('help.media.close')} onclick={closeLightbox}></button>
    <div class="lb-panel" role="dialog" aria-modal="true" aria-label={lightbox.caption}>
      <button class="lb-close" type="button" aria-label={$_('help.media.close')} onclick={closeLightbox}>✕</button>
      <video bind:this={lightboxVideo} src={DEMO} autoplay muted playsinline controls></video>
      <div class="lb-bar">
        <button class="lb-replay" type="button" onclick={replay}>↺ {$_('help.media.replay')}</button>
        <p class="lb-caption">{lightbox.caption}</p>
      </div>
    </div>
  </div>
{/if}

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
  .content h5 {
    margin: 1.2em 0 0.3em 0;
    font-size: 0.95em;
  }
  /* Evite que le titre vise se colle au bord haut lors d'un saut d'ancre. */
  .content h2,
  .content h3,
  .content h4,
  .content details {
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
  .warning {
    padding: 0.8em 1em;
    border-left: 3px solid #e0a800;
    border-radius: 0 0.3em 0.3em 0;
    background-color: rgba(224, 168, 0, 0.12);
  }
  .defs {
    margin: 0 0 1em 0;
    padding-left: 1.2em;
    max-width: 70ch;
    line-height: 1.6;
  }
  .defs li {
    margin-bottom: 0.4em;
  }
  .link,
  .kofi {
    color: var(--help-accent);
  }
  .kofi {
    display: inline-block;
    padding: 0.5em 1em;
    border: 1px solid var(--help-border);
    border-radius: 0.4em;
    text-decoration: none;
  }
  .kofi:hover {
    background-color: var(--help-hover);
  }

  /* ---- Sections repliables ---- */
  .content details {
    margin: 1em 0 1.5em 0;
    max-width: 70ch;
    border: 1px solid var(--help-border);
    border-radius: 0.5em;
    background-color: var(--help-sidebar-bg);
  }
  .content summary {
    padding: 0.7em 1em;
    font-weight: 600;
    color: var(--help-accent);
    cursor: pointer;
  }
  .content summary:hover {
    background-color: var(--help-hover);
  }
  .details-body {
    padding: 0 1em 1em 1em;
  }
  .details-body > :global(*:first-child) {
    margin-top: 0;
  }

  /* ---- Medias (webm) ---- */
  .help-media {
    margin: 1em 0 1.5em 0;
    max-width: 70ch;
  }
  .shot {
    display: block;
    position: relative;
    width: 100%;
    padding: 0;
    border: 1px solid var(--help-border);
    border-radius: 0.5em;
    background-color: var(--help-sidebar-bg);
    overflow: hidden;
    cursor: zoom-in;
  }
  .shot:focus-visible {
    outline: 2px solid var(--help-accent);
    outline-offset: 3px;
  }
  .shot video {
    display: block;
    width: 100%;
    height: auto;
  }
  /* Bandeau bas : n'occulte jamais le contenu du clip. */
  .shot-hint {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0.5em 0.8em;
    background: linear-gradient(transparent, rgba(10, 10, 12, 0.92) 45%);
    color: #fff;
    font-size: 0.8em;
    text-align: left;
    transform: translateY(100%);
    transition: transform 0.2s ease-out;
  }
  .shot:hover .shot-hint,
  .shot:focus-visible .shot-hint {
    transform: translateY(0);
  }
  .help-media figcaption {
    margin-top: 0.4em;
    font-size: 0.85em;
    color: var(--help-muted);
  }
  /* Emplacement d'une capture pas encore realisee. */
  .shot-todo {
    display: grid;
    place-items: center;
    aspect-ratio: 16 / 10;
    padding: 1em;
    border: 1px dashed var(--help-border);
    border-radius: 0.5em;
    background-color: var(--help-sidebar-bg);
    color: var(--help-muted);
    font-size: 0.85em;
    text-align: center;
  }

  /* ---- Lightbox ---- */
  .lb {
    position: fixed;
    inset: 0;
    z-index: 100;
  }
  .lb-backdrop {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    padding: 0;
    background-color: rgba(8, 8, 10, 0.82);
    cursor: zoom-out;
  }
  .lb-panel {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-rows: 1fr auto;
    gap: 1em;
    padding: 4vh 5vw;
    pointer-events: none;
  }
  .lb-panel video {
    place-self: center;
    width: min(72rem, 100%);
    max-height: 100%;
    border-radius: 0.5em;
    background-color: #000;
    pointer-events: auto;
  }
  .lb-bar {
    display: flex;
    align-items: center;
    gap: 1em;
    width: min(72rem, 100%);
    margin: 0 auto;
    pointer-events: auto;
  }
  .lb-caption {
    margin: 0;
    color: rgba(255, 255, 255, 0.78);
    font-size: 0.9em;
  }
  .lb-replay,
  .lb-close {
    border: 1px solid rgba(255, 255, 255, 0.3);
    background-color: rgba(255, 255, 255, 0.08);
    color: #fff;
    cursor: pointer;
  }
  .lb-replay {
    flex: 0 0 auto;
    padding: 0.6em 1.2em;
    border-radius: 2em;
    font-size: 0.85em;
  }
  .lb-close {
    position: absolute;
    top: 1em;
    right: 1em;
    width: 2.6em;
    height: 2.6em;
    border-radius: 50%;
    pointer-events: auto;
  }
  .lb-replay:hover,
  .lb-close:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
  .lb-replay:focus-visible,
  .lb-close:focus-visible,
  .lb-backdrop:focus-visible {
    outline: 2px solid var(--help-accent, #bf94ff);
    outline-offset: 2px;
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
    .lb-bar {
      flex-wrap: wrap;
      gap: 0.6em;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .shot-hint {
      transition: none;
    }
  }
</style>
