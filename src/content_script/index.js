console.log("################")
console.log("################")
console.log("CONTENT SCRIPT")
console.log("################")
console.log("################")

// Message types duplicated as literals instead of imported from
// src/constantes.ts: this file loads as a classic script, so no `import`.
const SESSION_USER_CHANGED = 'SESSION_USER_CHANGED';
const GET_SESSION_USER = 'GET_SESSION_USER';

const TWILIGHT_USER = 'twilight-user=';
// Kept in sync with src/svelte/twitchTheme.js, which this file cannot import.
const TWITCH_LIGHT_CLASS = 'tw-root--theme-light';

/** True when Twitch renders in dark mode. Defaults to dark. */
function readTwitchDark() {
  return !document.documentElement.classList.contains(TWITCH_LIGHT_CLASS);
}

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
// Replaced by injectScript(). Until something is injected there is nothing to
// hide nor to hand back.
let applyVisibility = () => {};

function createDivWithIframeInShwadowDom(mainDivId, iframeSrcUrl, cssUrl = '', allowTransparency = false) {
  const iframe = document.createElement('iframe');
  iframe.src = iframeSrcUrl;
  iframe.id = "inner-iframe";
  iframe.allowTransparency = allowTransparency ? "true" : "false";

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
  const url = `${chrome.runtime.getURL('src/iframe/config-popup.html')}?dark=${readTwitchDark() ? 1 : 0}`;
  document.body.appendChild(
    createDivWithIframeInShwadowDom('iframe-rem', url, chrome.runtime.getURL('assets/iframe.css'), true)
  );
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "DISPLAY_POPUP") {
    openConfigIframe();
  }
  else if (msg.type === "HIDE_POPUP") {
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


function injectScript() {
  let t = document.querySelector("#side-nav .side-nav-section")
  sidebarDiv = document.createElement('div')
  sidebarDiv.id = "sidebar_shadow";
  t.parentElement.insertBefore(sidebarDiv, t);
  // t.parentElement.insertBefore(maindiv, t.parentElement.lastElementChild)
  // t.insertBefore(maindiv, t.firstElementChild);

  let shadowParent = sidebarDiv.attachShadow({mode:'open'})
  const script2 = document.createElement('script');
  script2.src = chrome.runtime.getURL("sidebar_inject.js");
  script2.id = 'sidebar_inject';
  script2.type = 'module';
  shadowParent.appendChild(script2);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('assets/sidebar.css');
  shadowParent.appendChild(link);
  const link2 = document.createElement('link');
  link2.rel = 'stylesheet';
  link2.classList.add('injected-sidebar-css')
  link2.href = chrome.runtime.getURL('assets/dark_channel.css');
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

const injectObs = (obs, m) => {
  let t = document.querySelector("#side-nav .side-nav-section")
  let side = document.querySelector('.injected-sidebar-css');
  // console.log("observed changes")
  if (t && !side) {
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
  chrome.runtime.sendMessage({ type: SESSION_USER_CHANGED, data: id });
  if (id) ensureInjected();
  applyVisibility();
}

// A logout done in ANOTHER tab is only seen on returning to this one — enough,
// since the UI only exists in the tab being looked at.
document.addEventListener('visibilitychange', () => { if (!document.hidden) reportSession(); });
window.addEventListener('focus', reportSession);

// First report, unconditional: the worker does not know who is logged in yet,
// and this message bootstraps the whole pipeline.
chrome.runtime.sendMessage({ type: SESSION_USER_CHANGED, data: sessionUserId });
if (sessionUserId) startObservers();
