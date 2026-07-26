console.log("################")
console.log("################")
console.log("CONTENT SCRIPT")
console.log("################")
console.log("################")

// Types de message dupliqués en littéraux plutôt qu'importés de
// src/constantes.ts : le content script est chargé comme script classique (pas
// de "type": "module" dans le manifest), or un import partagé avec le service
// worker ferait sortir un chunk commun que Rollup référencerait par une
// instruction `import` — impossible à charger ici. Toute modification doit
// rester alignée sur src/constantes.ts.
const SESSION_USER_CHANGED = 'SESSION_USER_CHANGED';
const GET_SESSION_USER = 'GET_SESSION_USER';

const TWILIGHT_USER = 'twilight-user=';

/**
 * Identifiant du compte Twitch connecté dans CE navigateur, lu dans le cookie
 * de session. C'est la seule source de vérité : le token OAuth de l'extension
 * survit à une déconnexion du site et ne peut donc rien nous en dire.
 *
 * L'objet contient aussi un `authToken` : on ne lit que `id`, jamais le reste,
 * et rien de tout ça n'est stocké ni journalisé.
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
 * État replié de la barre latérale de Twitch, que l'extension ne fait
 * qu'observer. Il compte désormais au-delà de l'affichage : le panneau
 * d'autorisation vit dans la sidebar, or `:host([collapsed])` le masque
 * entièrement. Repliée, il n'existe donc plus aucune surface visible pour
 * autoriser l'extension, et l'action popup doit le dire.
 */
function isSideNavCollapsed() {
  return !!document.querySelector('.side-nav--collapsed');
}

let sessionUserId = getSessionUserId();
let sidebarDiv = null;
// Remplacée par injectScript(). Tant que rien n'est injecté, il n'y a rien à
// masquer ni à restituer.
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

const maindiv = createDivWithIframeInShwadowDom('iframe-rem', chrome.runtime.getURL('src/iframe/config-popup.html'),  chrome.runtime.getURL('assets/iframe.css'), true)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "DISPLAY_POPUP") {
    if (!document.querySelector("#iframe-rem")) {
      document.body.appendChild(maindiv);
    }
  }
  else if (msg.type === "HIDE_POPUP") {
    document.querySelector("#iframe-rem")?.remove();
  }
  else if (msg.type === GET_SESSION_USER) {
    // Chemin action popup : elle peut être ouverte alors que le service worker
    // vient de se réveiller et n'a plus l'état en mémoire.
    sendResponse({ userId: getSessionUserId(), sideNavCollapsed: isSideNavCollapsed() });
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
    // Déconnexion Twitch : on rend la sidebar au site plutôt que de retirer le
    // noeud du DOM. Retirer #sidebar_shadow n'annulerait ni les ports ni le
    // ping périodique de PortConnector (le module a déjà été évalué), et une
    // reconnexion réinjecterait un second script, donc un second jeu de ports.
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
 * Met en place la détection de la sidebar Twitch, puis l'injection. N'est
 * appelée QUE lorsqu'un compte est connecté : sans compte, l'extension n'a rien
 * à afficher, et injecter masquerait les sections natives de Twitch pour les
 * remplacer par du vide.
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

/** Réinjecte si Twitch a détruit notre noeud entre-temps (re-render du menu). */
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

// Une déconnexion faite dans un AUTRE onglet n'est vue qu'au retour sur
// celui-ci — ce qui suffit, l'UI n'existe que dans l'onglet regardé.
document.addEventListener('visibilitychange', () => { if (!document.hidden) reportSession(); });
window.addEventListener('focus', reportSession);

// Premier signalement, inconditionnel : le service worker ne sait pas encore
// qui est connecté, et c'est ce message qui amorce tout le pipeline.
chrome.runtime.sendMessage({ type: SESSION_USER_CHANGED, data: sessionUserId });
if (sessionUserId) startObservers();
