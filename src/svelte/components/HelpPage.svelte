<script>
  import * as CST from '../../constantes.js';
import { api } from '../../browserApi.js';
  import { _, locale } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { applyLocale } from '../../i18n/index.js';
  import { LANGUAGES } from '../../i18n/languages.js';
  import LanguageSelect from './LanguageSelect.svelte';
  import PortConnector from '../portConnector.svelte';

  // Snapshot taken by whoever opened the tab, so the page matches the surface
  // it was opened from. No live sync: a standalone tab cannot read Twitch.
  // Falls back to the OS theme when the param is missing (restored session).
  const darkParam = new URLSearchParams(location.search).get('dark');
  let darkTheme = $state(
    darkParam === null ? matchMedia('(prefers-color-scheme: dark)').matches : darkParam !== '0'
  );

  // Language: same mechanism. `lang` is resynced too, so the select follows a
  // change coming from elsewhere (action popup).
  let lang = $state(get(locale) ?? 'en');
  let localePort = new PortConnector((msg) => {
    applyLocale(msg.data);
    if (msg.data) lang = msg.data;
  }, "locale");

  function onLocaleChange() {
    // Persist, plus live broadcast to the other pages through the background.
    api.runtime.sendMessage({ type: CST.CHANGE_LOCALE, value: lang });
    applyLocale(lang);
  }

  // Fallback clip, used by every `media()` call that has no `video_url` yet.
  // TODO: pass the real per-section file at each call site (see README) once
  // the captures exist, then drop this.
  const DEMO = '/assets/webm/Video.webm';

  const ISSUES_URL = 'https://github.com/lKarmaKat/twitch-ultimate-folder/issues/new';
  // TODO: replace with the real Ko-fi account.
  const KOFI_URL = 'https://ko-fi.com/karmakat__';

  // Lightbox: `lightbox` holds the open video's caption, or null. The thumbnail
  // stays frozen on its first frame; only the enlarged copy plays.
  let lightbox = $state(null);
  let lightboxVideo = $state(null);

  function openLightbox(caption, src, kind = 'video') {
    lightbox = { caption, src, kind };
  }

  function closeLightbox() {
    lightbox = null;
  }

  // Explicit rewind: `currentTime = 0` is enough on a <video>, where a GIF
  // would need its src reassigned.
  function replay() {
    if (!lightboxVideo) return;
    lightboxVideo.currentTime = 0;
    lightboxVideo.play();
  }

  function onKeydown(e) {
    if (lightbox && e.key === 'Escape') closeLightbox();
  }

  // Hand-written table of contents: these ids must match the anchors on the
  // headings. The array only feeds the orphan-anchor check in dev.
  const IDS = [
    'purpose',
    'hierarchy',
    'sorting',
    'outside',
    'offline',
    'connect',
    'revoke',
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
    'list-style',
    'style-layout',
    'style-colors',
    'style-header-options',
    'style-header-size',
    'style-icon',
    'style-badge',
    'list-content',
    'add-channel',
    'move-item',
    'all-other',
    'saving',
    'action-popup',
    'issues',
    'support',
  ];

  // An anchor pointing into a collapsed <details> leads nowhere on browsers
  // that do not expand it themselves, so open it by hand.
  function openTargetDetails() {
    const el = document.getElementById(location.hash.slice(1));
    if (el?.tagName === 'DETAILS') el.open = true;
  }

  // The browser handles the URL fragment at parse time, before help_inject.js
  // mounts this page, so the native jump falls into the void. Replay it here.
  function scrollToHash() {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (!el) return;
    openTargetDetails();
    el.scrollIntoView();
  }

  onMount(() => {
    if (!location.hash) return;
    // One frame of wait: the DOM was just inserted, the layout was not.
    requestAnimationFrame(scrollToHash);
    // Thumbnails are `height: auto` with preload="metadata": their real height
    // lands later and shifts everything below, so reposition once measured.
    if (document.readyState === 'complete') return;
    window.addEventListener('load', scrollToHash, { once: true });
    return () => window.removeEventListener('load', scrollToHash);
  });

  // Guard rail for the manual TOC: a dangling anchor throws nothing at runtime,
  // so report it at least in dev.
  $effect(() => {
    if (!import.meta.env.DEV) return;
    for (const id of IDS) {
      if (!document.getElementById(id)) console.warn('[help] orphan anchor:', id);
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

<!-- One single definition of the video thumbnail: it repeats a dozen times and
     the lightbox must stay identical everywhere. -->
{#snippet media(caption, video_url)}
  {@const src = video_url ?? DEMO}
  <figure class="help-media">
    <button class="shot" type="button" onclick={() => openLightbox(caption, src)}>
      <video {src} preload="metadata" muted playsinline></video>
      <span class="shot-hint">{$_('help.media.hint')} ⤢</span>
    </button>
    <figcaption>{caption}</figcaption>
  </figure>
{/snippet}

<!-- TODO: replace with <img src="/assets/screenshots/…"> once the captures
     exist. The block holds the space and the ratio meanwhile. -->
{#snippet screenshot(alt, caption)}
  <figure class="help-media">
    <div class="shot-todo" role="img" aria-label={alt}>{alt}</div>
    <figcaption>{caption}</figcaption>
  </figure>
{/snippet}

<!-- Small, clickable variant of `screenshot`: opens the same lightbox as a
     video would, minus the replay bar, which makes no sense on a still image. -->
{#snippet layoutShot(alt, caption)}
  <figure class="help-media layout-shot">
    <button class="shot" type="button" onclick={() => openLightbox(caption, null, 'image')}>
      <div class="shot-todo" role="img" aria-label={alt}>{alt}</div>
      <span class="shot-hint">{$_('help.media.hint')} ⤢</span>
    </button>
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
        <li>
          <a href="#connect">{$_('help.connect.title')}</a>
          <ul>
            <li><a href="#revoke">{$_('help.connect.revokeTitle')}</a></li>
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
            <li>
              <a href="#add-list">{$_('help.createConfig.addListTitle')}</a>
              <ul>
                <li><a href="#remove-item">{$_('help.createConfig.removeTitle')}</a></li>
                <li><a href="#rename-list">{$_('help.createConfig.renameTitle')}</a></li>
                <li><a href="#list-behaviour">{$_('help.createConfig.behaviourTitle')}</a></li>
                <li>
                  <a href="#list-style">{$_('help.createConfig.styleTitle')}</a>
                  <ul>
                    <li><a href="#style-layout">{$_('help.createConfig.layoutTitle')}</a></li>
                    <li><a href="#style-colors">{$_('help.createConfig.colorsTitle')}</a></li>
                    <li><a href="#style-header-options">{$_('help.createConfig.headerOptionsTitle')}</a></li>
                    <li><a href="#style-header-size">{$_('help.createConfig.headerSizeTitle')}</a></li>
                    <li><a href="#style-icon">{$_('help.createConfig.iconsTitle')}</a></li>
                    <li><a href="#style-badge">{$_('help.createConfig.badgesTitle')}</a></li>
                  </ul>
                </li>
                <li><a href="#list-content">{$_('help.createConfig.contentTitle')}</a></li>
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

    <h3 id="revoke">{$_('help.connect.revokeTitle')}</h3>
    <p>{$_('help.connect.revokeIntro')}</p>
    <ol class="defs">
      <li>{$_('help.connect.revokeStep1')}</li>
      <li>{$_('help.connect.revokeStep2')}</li>
      <li>{$_('help.connect.revokeStep3')}</li>
    </ol>
    <p>{$_('help.connect.revokeOutro')}</p>

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
          <li><b>{$_('typeOptions.exclusive.label')}</b> — {$_('help.createConfig.behaviourExclusive')}</li>
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

    <details id="list-style">
      <summary>{$_('help.createConfig.styleTitle')}</summary>
      <div class="details-body">
        <p>{$_('help.createConfig.styleIntro', { values: { style: $_('configPannel.style') } })}</p>

        <h4 id="style-layout">{$_('help.createConfig.layoutTitle')}</h4>
        <p>{$_('help.createConfig.layoutIntro', { values: { layout: $_('configPannel.listLayout') } })}</p>
        <ul class="defs">
          <li>
            <b>{$_('listLayout.stack')}</b> — {$_('help.createConfig.layoutStack')}
            {@render layoutShot($_('listLayout.stack'), $_('help.createConfig.layoutStackCaption'))}
          </li>
          <li>
            <b>{$_('listLayout.split')}</b> — {$_('help.createConfig.layoutSplit')}
            {@render layoutShot($_('listLayout.split'), $_('help.createConfig.layoutSplitCaption'))}
          </li>
          <li>
            <b>{$_('listLayout.flyout')}</b> — {$_('help.createConfig.layoutFlyout')}
            {@render layoutShot($_('listLayout.flyout'), $_('help.createConfig.layoutFlyoutCaption'))}
          </li>
          <li>
            <b>{$_('listLayout.tabs')}</b> — {$_('help.createConfig.layoutTabs')}
            {@render layoutShot($_('listLayout.tabs'), $_('help.createConfig.layoutTabsCaption'))}
          </li>
          <li>
            <b>{$_('listLayout.grid')}</b> — {$_('help.createConfig.layoutGrid', { values: { columns: $_('configPannel.listColumns') } })}
            {@render layoutShot($_('listLayout.grid'), $_('help.createConfig.layoutGridCaption'))}
          </li>
          <li>
            <b>{$_('listLayout.dock')}</b> — {$_('help.createConfig.layoutDock')}
            {@render layoutShot($_('listLayout.dock'), $_('help.createConfig.layoutDockCaption'))}
          </li>
        </ul>

        <h4 id="style-colors">{$_('help.createConfig.colorsTitle')}</h4>
        <p>{$_('help.createConfig.colorsIntro')}</p>
        <p>{$_('help.createConfig.colorsDefault', { values: { none: $_('common.none') } })}</p>
        {@render screenshot($_('help.createConfig.colorsShotAlt'), $_('help.createConfig.colorsShotCaption'))}

        <h4 id="style-header-options">{$_('help.createConfig.headerOptionsTitle')}</h4>
        <ul class="defs">
          <li><b>{$_('styleOptions.pillHeader.label')}</b> — {$_('help.createConfig.headerOptionsRounded', { values: { bar: $_('styleOptions.hasBar.label') } })}</li>
          <li><b>{$_('styleOptions.indentRail.label')}</b> — {$_('help.createConfig.headerOptionsRail')}</li>
          <li><b>{$_('styleOptions.hasBar.label')}</b> — {$_('help.createConfig.headerOptionsBar')}</li>
        </ul>

        <h4 id="style-header-size">{$_('help.createConfig.headerSizeTitle')}</h4>
        <ul class="defs">
          <li><b>{$_('headerHeight.medium')}</b> — {$_('help.createConfig.headerSizeDefault')}</li>
          <li><b>{$_('headerHeight.small')}</b> — {$_('help.createConfig.headerSizeSmallDesc')}</li>
        </ul>

        <h4 id="style-icon">{$_('help.createConfig.iconsTitle')}</h4>
        <p>{$_('help.createConfig.icons1')}</p>
        <p>{$_('help.createConfig.icons2')}</p>
        {@render screenshot($_('help.createConfig.iconsShotAlt'), $_('help.createConfig.iconsShotCaption'))}

        <h4 id="style-badge">{$_('help.createConfig.badgesTitle')}</h4>
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

    <details id="list-content">
      <summary>{$_('help.createConfig.contentTitle')}</summary>
      <div class="details-body">
        <p>{$_('help.createConfig.contentIntro', { values: { source: $_('configPannel.sourceContent') } })}</p>
        <p class="warning">{$_('help.createConfig.contentWarning', { values: { manual: $_('sourceKind.manual') } })}</p>
        <p>{$_('help.createConfig.contentRulesIntro')}</p>
        <ul class="defs">
          <li><b>{$_('sourceKind.game')}</b> — {$_('help.createConfig.contentGame')}</li>
          <li><b>{$_('sourceKind.language')}</b> — {$_('help.createConfig.contentLanguage')}</li>
          <li><b>{$_('sourceKind.fresh')}</b> — {$_('help.createConfig.contentFresh')}</li>
        </ul>
        <p>{$_('help.createConfig.contentExclusiveNote')}</p>
        {@render screenshot($_('help.createConfig.contentShotAlt'), $_('help.createConfig.contentShotCaption'))}
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

    <h3>{$_('actionPopup.alignment')}</h3>
    <p>{$_('help.actionPopup.alignment')}</p>
    {@render media($_('help.actionPopup.alignmentCaption'))}

    <h3>{$_('actionPopup.titleSide')}</h3>
    <p>{$_('help.actionPopup.titleSide')}</p>
    {@render media($_('help.actionPopup.titleSideCaption'))}

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
      <a class="kofi" href={KOFI_URL} target="_blank" rel="noopener noreferrer">
        <span class="kofi-ico" aria-hidden="true">☕</span>{$_('help.support.link')}
      </a>
    </p>
  </main>
</div>

{#if lightbox}
  <div class="lb">
    <!-- The backdrop is a button: closes on click, reachable from a keyboard. -->
    <button class="lb-backdrop" type="button" aria-label={$_('help.media.close')} onclick={closeLightbox}></button>
    <div class="lb-panel" role="dialog" aria-modal="true" aria-label={lightbox.caption}>
      <button class="lb-close" type="button" aria-label={$_('help.media.close')} onclick={closeLightbox}>✕</button>
      {#if lightbox.kind === 'image'}
        <div class="lb-image-todo" role="img" aria-label={lightbox.caption}>{lightbox.caption}</div>
      {:else}
        <video bind:this={lightboxVideo} src={lightbox.src} autoplay muted playsinline controls></video>
      {/if}
      <div class="lb-bar">
        {#if lightbox.kind !== 'image'}
          <button class="lb-replay" type="button" onclick={replay}>↺ {$_('help.media.replay')}</button>
        {/if}
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
    /* Light palette by default, overridden by .dark below. */
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
    /* The parent never scrolls: each column handles its own overflow. */
    overflow: hidden;
    background-color: var(--help-bg);
    color: var(--help-fg);
  }

  .help-layout.dark {
    --help-bg: #18181b;
    --help-fg: rgb(239, 239, 241);
    --help-muted: rgb(191, 148, 255);
    /* --help-muted: rgb(173, 173, 184); */
    --help-accent: rgb(191, 148, 255);
    --help-sidebar-bg: #0e0e10;
    --help-border: #35353b;
    --help-hover: rgba(145, 71, 255, 0.22);
  }

  /* ---- Left column ---- */
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

  /* ---- Table of contents ---- */
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
  /* A single rule covers every nesting depth. */
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

  /* ---- Content ---- */
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
  /* Keeps the targeted heading off the top edge after an anchor jump. */
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
    /* Flex, not inline-block: the cup is its own bigger box now, and it has to
       stay centred against the label instead of sitting on the text baseline. */
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.5em 1em;
    border: 1px solid var(--help-border);
    border-radius: 0.4em;
    text-decoration: none;
  }
  .kofi-ico {
    font-size: 1.5em;
    line-height: 1;
  }
  .kofi:hover {
    background-color: var(--help-hover);
  }

  /* ---- Collapsible sections ---- */
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

  /* ---- Media (webm) ---- */
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
  /* Bottom strip: never hides the clip's content. */
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
  /* Placeholder for a screenshot not taken yet. */
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
  /* Small inline variant used next to a layout's description. */
  .layout-shot {
    max-width: 220px;
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
  .lb-image-todo {
    place-self: center;
    display: grid;
    place-items: center;
    width: min(72rem, 100%);
    aspect-ratio: 16 / 10;
    padding: 2em;
    border: 1px dashed rgba(255, 255, 255, 0.35);
    border-radius: 0.5em;
    background-color: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.78);
    text-align: center;
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
