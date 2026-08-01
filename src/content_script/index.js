console.log("################")
console.log("################")
console.log("CONTENT SCRIPT")
console.log("################")
console.log("################")

// Ce fichier est bundle en IIFE (voir la passe `content` de vite.config.ts) :
// il peut donc importer, contrairement a un module ES qu'un content script ne
// sait pas charger. C'est aussi lui qui embarque desormais la sidebar Svelte,
// qui tournait avant dans le monde principal de la page.
import { api } from '../browserApi.js';
import { SESSION_USER_CHANGED, GET_SESSION_USER, DISPLAY_POPUP, HIDE_POPUP } from '../constantes.js';
import { readTwitchDark } from '../svelte/twitchTheme.js';
import { mountSidebar, mountTitlePopup, whenI18nReady } from '../svelte/injects/sidebar_inject.js';

const TWILIGHT_USER = 'twilight-user=';

/**
 * Twitch account logged into THIS browser, read from the session cookie — the
 * only source of truth. Only `id` is read; the cookie's rest is never touched.
 */
function getSessionUserId() {
  const raw = document.cookie.split('; ').find(c => c.startsWith(TWILIGHT_USER));
  if (!raw) return null;
  try {
    const { id } = JSON.parse(decodeURIComponent(raw.slice(TWILIGHT_USER.length)));
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

/**
 * Collapsed state of Twitch's own sidebar. It matters beyond layout: collapsed,
 * `:host([collapsed])` hides the authorization panel entirely.
 */
function isSideNavCollapsed() {
  return !!document.querySelector('.side-nav--collapsed');
}

let sessionUserId = getSessionUserId();
let sidebarDiv = null;
let flyoutDiv = null;
// Replaced by injectScript(). Until something is injected there is nothing to
// hide nor to hand back.
let applyVisibility = () => {};

function createDivWithIframeInShwadowDom(mainDivId, iframeSrcUrl, cssUrl = '', allowTransparency = false) {
  const iframe = document.createElement('iframe');
  iframe.src = iframeSrcUrl;
  iframe.id = "inner-iframe";
  iframe.allowTransparency = allowTransparency ? "true" : "false";
  // Cross-origin chrome-extension:// iframe: without this delegation the
  // Permissions-Policy keeps clipboard-write to the top document.
  iframe.allow = "clipboard-write";

  const maindiv = document.createElement('div')
  maindiv.id = mainDivId;
  let shadowParent = maindiv.attachShadow({mode:'open'});

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;

  shadowParent.appendChild(link);
  shadowParent.appendChild(iframe)

  return maindiv;
}

/**
 * Built on demand: the iframe is a separate document, so the theme travels as a
 * URL param and the URL is only known when the popup actually opens.
 */
function openConfigIframe() {
  if (document.querySelector('#iframe-rem')) return;
  const url = `${api.runtime.getURL('src/iframe/config-popup.html')}?dark=${readTwitchDark() ? 1 : 0}`;
  document.body.appendChild(
    createDivWithIframeInShwadowDom('iframe-rem', url, api.runtime.getURL('assets/iframe.css'), true)
  );
}

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === DISPLAY_POPUP) {
    openConfigIframe();
  }
  else if (msg.type === HIDE_POPUP) {
    document.querySelector("#iframe-rem")?.remove();
  }
  else if (msg.type === GET_SESSION_USER) {
    // Action popup path: it may open just as the service worker wakes up with
    // no state left in memory.
    sendResponse({
      userId: getSessionUserId(),
      sideNavCollapsed: isSideNavCollapsed(),
      twitchDark: readTwitchDark()
    });
    return true;
  }

});



window.addEventListener("message", (event) => {
  if (event.data.type === 'navigate') {

    window.history.pushState({}, '', event.data.channel);

    window.dispatchEvent(new PopStateEvent('popstate'));
  }
});


// Le hash de classe (--csO9S) change a chaque build de Twitch : on ne peut
// s'accrocher qu'au prefixe.
const STORIES_SEL = ':scope > [class*="storiesLeftNavSection"]';

/**
 * Place (ou replace) notre div juste apres la section Stories. Twitch la rend
 * de facon asynchrone : si elle arrive apres notre injection, React l'insere
 * en se referant a la premiere .side-nav-section, donc entre notre div et
 * elle — et on se retrouve au-dessus. D'ou le repositionnement plutot qu'un
 * simple ancrage au moment de l'injection.
 *
 * Les tests `!== sidebarDiv` sont ce qui evite la boucle infinie : l'observer
 * ci-dessous se declenche sur notre propre insertion et doit alors ne rien
 * faire. Deplacer sidebarDiv une fois monte est sans danger, un move DOM
 * preserve le shadow root et l'etat Svelte.
 */
function placeSidebar(parent) {
  const stories = parent.querySelector(STORIES_SEL);
  if (stories) {
    if (stories.nextElementSibling !== sidebarDiv) stories.after(sidebarDiv);
    return;
  }
  const section = parent.querySelector(':scope > .side-nav-section');
  if (section && section.previousElementSibling !== sidebarDiv) section.before(sidebarDiv);
}

/**
 * flyoutList's body lives outside the sidebar's own shadow root (see
 * FlyoutPopup.svelte), so it needs its own host + its own copy of the theme
 * stylesheet. Reused across re-injections: only the mounted component inside
 * is torn down and rebuilt, by mountSidebar().
 */
function ensureFlyoutHost() {
  if (flyoutDiv?.isConnected) return flyoutDiv.shadowRoot;
  flyoutDiv = document.createElement('div');
  flyoutDiv.id = 'flyout_shadow';
  document.body.appendChild(flyoutDiv);
  const shadow = flyoutDiv.attachShadow({ mode: 'open' });
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = api.runtime.getURL('assets/dark_channel.css');
  shadow.appendChild(link);
  return shadow;
}

function injectScript() {
  let t = document.querySelector("#side-nav .side-nav-section")
  sidebarDiv = document.createElement('div')
  sidebarDiv.id = "sidebar_shadow";
  const navParent = t.parentElement;
  placeSidebar(navParent);
  new MutationObserver(() => placeSidebar(navParent)).observe(navParent, { childList: true });

  let shadowParent = sidebarDiv.attachShadow({mode:'open'})
  // Montage direct : la sidebar fait partie de ce bundle et tourne donc dans le
  // monde isole, ou api.runtime.connect() et api.storage sont disponibles.
  whenI18nReady().then(() => mountSidebar(shadowParent, ensureFlyoutHost()));
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = api.runtime.getURL('assets/sidebar.css');
  shadowParent.appendChild(link);
  const link2 = document.createElement('link');
  link2.rel = 'stylesheet';
  link2.href = api.runtime.getURL('assets/dark_channel.css');
  shadowParent.appendChild(link2);


  const sideNav = document.querySelector('#side-nav');
  // sideNav.style.setProperty('width', '34rem', 'important');

  const sections = () => document.querySelectorAll('#side-nav .side-nav-section');

  applyVisibility = () => {
    const collapsed = isSideNavCollapsed();
    // On logout, hand the sidebar back rather than removing our node: removing
    // it cancels neither the ports nor PortConnector's ping.
    if (collapsed || !sessionUserId) {
      sidebarDiv.setAttribute('collapsed', "true");
      sections().forEach(el => el.style.removeProperty('display'));
    } else {
      sidebarDiv.removeAttribute('collapsed');
      sections().forEach(el => el.style.setProperty('display', 'none', 'important'));
    }
  }
  const obs = new MutationObserver(applyVisibility);
  applyVisibility();
  obs.observe(document.querySelector('.side-nav--collapsed, .side-nav--expanded'), {attributeFilter: ['class'], attributes: true})

}

/**
 * `obs` peut etre reveille apres coup : le second observateur de
 * startObservers() le rebranche sur la section de la side-nav une fois
 * celle-ci apparue, meme s'il s'est deja deconnecte ici. Le garde-fou doit
 * donc tenir a chaque appel — il cherchait auparavant .injected-sidebar-css,
 * qui vit DANS le shadow root et reste donc invisible a document.querySelector.
 * Le double appel etait masque par le cache de modules ES tant que la sidebar
 * etait chargee par <script type="module"> ; elle est desormais montee par
 * appel direct, et se dedoublait.
 */
const injectObs = (obs, m) => {
  let t = document.querySelector("#side-nav .side-nav-section")
  if (t && !sidebarDiv?.isConnected) {
    injectScript();
    if (m) { // always true ?
      console.log("Injected by mutation observer")
    }
    obs.disconnect();
  }
}

/**
 * Sets up Twitch sidebar detection, then injection. Called ONLY when an account
 * is logged in, or we would hide Twitch's own sections and show nothing.
 */
function startObservers() {
  const observer = new MutationObserver((mut, obs) => {
    injectObs(obs, true)
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  new MutationObserver((mut, obs) => {
    let t = document.querySelector("#side-nav .side-nav-section")
    if (t) {
      observer.observe(t, {
        childList: true,
        subtree: true
      });
      obs.disconnect()
    }
  }).observe(document.body, { childList: true, subtree: true })

  injectObs(observer);
}

/** Re-injects if Twitch destroyed our node meanwhile (menu re-render). */
function ensureInjected() {
  if (sidebarDiv?.isConnected) return;
  startObservers();
}

function reportSession() {
  const id = getSessionUserId();
  if (id === sessionUserId) return;
  sessionUserId = id;
  api.runtime.sendMessage({ type: SESSION_USER_CHANGED, data: id });
  if (id) ensureInjected();
  applyVisibility();
}

// A logout done in ANOTHER tab is only seen on returning to this one — enough,
// since the UI only exists in the tab being looked at.
document.addEventListener('visibilitychange', () => { if (!document.hidden) reportSession(); });
window.addEventListener('focus', reportSession);

// First report, unconditional: the worker does not know who is logged in yet,
// and this message bootstraps the whole pipeline.
api.runtime.sendMessage({ type: SESSION_USER_CHANGED, data: sessionUserId });
if (sessionUserId) startObservers();

// TitlePopup vit sur document.body, hors du shadow root de la sidebar : son
// montage ne depend donc pas de l'apparition de la sidebar de Twitch.
whenI18nReady().then(mountTitlePopup);
