import { TwitchApi } from './twitch';
import PortManager from './portManager'
import { ConfigManager } from './configManage';
import { TokenManager } from "./token";
import { logErrorChain, wrapError } from "./errors";
import * as CST from '../constantes.js'
import { DataPusher } from './dataPusher';

const logBackgroundError = (context: string, error: unknown) => {
  logErrorChain(context, error);
};

console.log("####################");
console.log("Background.js");
console.log("####################");

const tokenManager = new TokenManager();

let twitchApi: TwitchApi | null = null;
let configManager: ConfigManager | null = null;
let streamsDatasPoller: DataPusher | null = null;

// Utilisateur Twitch actuellement connecté dans le navigateur, tel que rapporté
// par le content script. Rien n'est initialisé au démarrage du service worker :
// on ne sait pas encore QUI est connecté, et sans onglet Twitch il n'y a de
// toute façon rien à afficher ni aucune raison d'appeler l'API.
let currentUserId: number | null = null;
// null = état pas encore établi ; les pages l'interprètent comme « en attente »
// et affichent leur écran de chargement plutôt qu'un faux « déconnecté ».
let currentAuthState: string | null = null;
// Un changement de compte fait du réseau (validate, parfois refresh). Deux
// bascules rapprochées peuvent se terminer dans le désordre : ce compteur
// garantit que seule la plus récente écrit l'état final.
let switchEpoch = 0;

function broadcastAuth(state: string) {
  currentAuthState = state;
  portManager.sendMessageToAllTabs(CST.AUTH_STATE, state, "auth");
}

/**
 * Diffuse le code d'activation à TOUTES les sidebars ouvertes, et pas seulement
 * à celle d'où part le clic : l'utilisateur qui a plusieurs onglets Twitch doit
 * pouvoir saisir le code depuis n'importe lequel.
 *
 * Il n'existe pas de diffusion « code effacé » : les sidebars jettent leur code
 * dès qu'un AUTH_STATE arrive, et le background en émet un à la fin de chaque
 * flow, succès (READY) comme échec (NEED_AUTH).
 */
function broadcastDeviceCode(info: { user_code: string; verification_uri: string }) {
  portManager.sendMessageToAllTabs(CST.AUTH_DEVICE_CODE, {
    user_code: info.user_code,
    verification_uri: info.verification_uri
  }, "auth");
}

function teardown() {
  streamsDatasPoller?.stop();
  streamsDatasPoller = null;
  configManager = null;
  twitchApi = null;
}

/**
 * Point d'entrée unique des changements de session Twitch : connexion,
 * déconnexion, changement de compte. Tout le pipeline (tokens, config, poller,
 * diffusion aux pages) est reconstruit ici, jamais ailleurs.
 */
async function onSessionUserChanged(sessionUserId: number | null) {
  // Idempotent : chaque onglet signale la même session. Le test sur
  // currentAuthState laisse néanmoins passer le tout premier appel, y compris
  // « pas de session » (null === null), qui doit bien être diffusé une fois.
  if (sessionUserId === currentUserId && currentAuthState !== null) return;
  const epoch = ++switchEpoch;

  teardown();
  currentUserId = sessionUserId;

  if (sessionUserId === null) {
    tokenManager.clear();
    broadcastAuth(CST.AUTH_NO_SESSION);
    return;
  }

  const hasToken = await tokenManager.switchUser(sessionUserId);
  if (epoch !== switchEpoch) return; // une bascule plus récente a pris la main

  if (!hasToken) {
    broadcastAuth(CST.AUTH_NEED_AUTH);
    return;
  }

  // READY dès que le token est utilisable, SANS attendre initServices : celui-ci
  // déclenche le premier chargement Helix complet (chaînes suivies + lives +
  // photos de profil, tous paginés), soit plusieurs secondes sur un gros compte.
  // Les pages savent afficher « en attente de données » ; leur laisser « à
  // autoriser » pendant ce temps serait faux, l'autorisation est acquise.
  broadcastAuth(CST.AUTH_READY);
  await initServices(sessionUserId);
}

// Token devenu irrécupérable en cours de session (révocation depuis les
// paramètres Twitch, par exemple) : on coupe le poller et on redemande une
// autorisation plutôt que de boucler sur des 401.
tokenManager.onAuthLost = () => {
  if (currentUserId === null) return;
  teardown();
  broadcastAuth(CST.AUTH_NEED_AUTH);
};

async function initServices(userId: number) {
    console.log("BACKGROUND initService")
    twitchApi = new TwitchApi(tokenManager);
    configManager = new ConfigManager(twitchApi);
    configManager.initConfigWithUser(userId);
    streamsDatasPoller = new DataPusher(twitchApi, (data) => {
        portManager.sendMessageToAllTabs(CST.GET_STREAMS_REF, data);
    });
    streamsDatasPoller.start();

    // Rattrapage pour les ports connectés avant que l'auth soit prête
    try {
        const [currentConfig, streamInfo] = await Promise.all([
            configManager.getConfigObjectForCurrentUser(),
            streamsDatasPoller.getConfig()
        ]);

        if (currentConfig) portManager.sendMessageToAllTabs(CST.GET_CURRENT_CONFIGURATION, currentConfig);
        if (streamInfo) portManager.sendMessageToAllTabs(CST.GET_STREAMS_REF, streamInfo);
    } catch (e) {
        logBackgroundError("initServices:initialBroadcast", e);
    }
}

// Formes à callback plutôt que promesses : sur Firefox le namespace chrome.*
// est fourni pour compatibilité et ne renvoie pas de promesse.
function queryActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (chrome.runtime.lastError) return resolve(undefined);
      resolve(tabs[0]);
    });
  });
}

interface TabSession {
  userId: string | null;
  /** Sidebar Twitch repliée : le panneau d'autorisation y est invisible. */
  sideNavCollapsed: boolean;
}

function askTabForSession(tabId: number): Promise<TabSession> {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(tabId, { type: CST.GET_SESSION_USER }, (response) => {
      // Pas de content script à l'autre bout (page pas encore chargée, ou
      // onglet Twitch ouvert avant l'installation) : lastError, pas un crash.
      if (chrome.runtime.lastError || !response) {
        return resolve({ userId: null, sideNavCollapsed: false });
      }
      resolve({
        userId: typeof response.userId === 'string' ? response.userId : null,
        sideNavCollapsed: response.sideNavCollapsed === true
      });
    });
  });
}

/**
 * Réamorce le pipeline depuis un onglet précis. Utilisé quand le service worker
 * a été tué : `currentUserId` est alors perdu alors que l'onglet, lui, n'a
 * aucune raison de re-signaler une session qui n'a pas changé de son point de vue.
 */
async function resolveSessionForTab(tabId: number): Promise<TabSession> {
  const session = await askTabForSession(tabId);
  // Appel inconditionnel : la garde d'idempotence d'onSessionUserChanged sait
  // déjà distinguer « rien n'a changé » de « état jamais établi ».
  await onSessionUserChanged(session.userId ? Number(session.userId) : null);
  return session;
}

/**
 * État à afficher dans l'action popup, résolu à la demande depuis l'onglet
 * ACTIF. On ne répond pas depuis `currentUserId` : le service worker MV3 est
 * tué après inactivité, et son réveil donnerait un faux « pas de session »
 * tant qu'aucun content script n'a re-signalé la sienne.
 *
 * L'onglet actif, et non « un onglet Twitch quelconque », parce que c'est déjà
 * la cible de « Ouvrir la configuration » : le message affiché reste donc exact.
 */
async function resolveActiveTabSession(): Promise<{ state: string; sideNavCollapsed: boolean }> {
  const tab = await queryActiveTab();
  if (!tab?.url || !tab.url.startsWith('https://www.twitch.tv/') || tab.id === undefined) {
    return { state: CST.AUTH_NOT_ON_TWITCH, sideNavCollapsed: false };
  }

  // Réveil du service worker, ou session apparue pendant qu'il dormait : on
  // reconstruit le pipeline AVANT de répondre. Sinon on afficherait « autorisez
  // l'extension » à quelqu'un qui l'a déjà autorisée, simplement parce que
  // currentUserId a été perdu avec le worker.
  const session = await resolveSessionForTab(tab.id);
  if (!session.userId) return { state: CST.AUTH_NO_SESSION, sideNavCollapsed: false };

  return {
    state: currentUserId !== null && tokenManager.token ? CST.AUTH_READY : CST.AUTH_NEED_AUTH,
    sideNavCollapsed: session.sideNavCollapsed
  };
}

let sendStreamInfoOnConnect = (port: chrome.runtime.Port) => {
  if (streamsDatasPoller) {
    streamsDatasPoller.getConfig().then((info) => {
      // console.log("updating bg");
      port.postMessage({
        "type": CST.GET_STREAMS_REF,
        "data": info
      });
    }).catch((error) => {
      logBackgroundError("background:sendStreamInfoOnConnect", wrapError("Background failed to send stream info on connect", error));
    });
  }
};

let sendCurrentConfigOnConnect = (port: chrome.runtime.Port) => {
  if (configManager) {
    configManager.getConfigObjectForCurrentUser().then((currentConfig) => {
      if (!currentConfig) return;
      port.postMessage({
        "type": CST.GET_CURRENT_CONFIGURATION,
        "data": currentConfig
      })
    }).catch(err => {
      logBackgroundError("background:sendCurrentConfigOnConnect", err)
    });
  }
}

let themeSombre = false;
chrome.storage.local.get("theme").then((data) => {
  themeSombre = data.theme === 1 ? true : false;
});
let sendCurrentThemeOnConnect = (port: chrome.runtime.Port) => {
  port.postMessage({
    "type": CST.THEME, // RENVOYER LE TYPE NE SERT A RIEN ICI
    "data": themeSombre
  });
}
let currentAlignmentLeft = true;
chrome.storage.local.get("alignmentLeft").then((data) => {
  currentAlignmentLeft = data.alignmentLeft === 0 ? false : true ;
})
let sendCurrentAlignmentOnConnect = (port: chrome.runtime.Port) => {
  port.postMessage({
    "type": CST.THEME, // RENVOYER LE TYPE NE SERT A RIEN ICI
    "data": currentAlignmentLeft
  });
}

let currentLocale: string | undefined;
chrome.storage.local.get("local").then((data) => {
  currentLocale = data.local as string | undefined;
});
let sendCurrentLocaleOnConnect = (port: chrome.runtime.Port) => {
  if (!currentLocale) return;
  port.postMessage({
    "type": CST.LOCALE,
    "data": currentLocale
  });
}

let sendCurrentAuth = (port: chrome.runtime.Port) => {
  port.postMessage({
    "type": CST.AUTH_STATE,
    "data": currentAuthState
  });

  // Onglet ouvert (ou rechargé) PENDANT un device flow lancé depuis un autre :
  // il a manqué la diffusion, son port n'existait pas encore. Sans ce rattrapage
  // il afficherait le bouton « Autoriser », dont le clic retomberait sur la
  // branche `authInProgressPromise` de TokenManager — laquelle n'appelle pas le
  // callback : l'onglet resterait bloqué sans jamais voir de code.
  // Après le AUTH_STATE ci-dessus, jamais avant : la sidebar efface son code à
  // chaque état reçu, l'ordre inverse effacerait ce qu'on vient d'envoyer.
  const pending = tokenManager.currentDeviceCodeInfo;
  if (pending?.user_code) {
    port.postMessage({
      "type": CST.AUTH_DEVICE_CODE,
      "data": { user_code: pending.user_code, verification_uri: pending.verification_uri }
    });
  }

  // Le service worker a pu être tué puis relancé alors que l'onglet, lui, est
  // resté ouvert : le content script n'a alors aucune raison de re-signaler sa
  // session (elle n'a pas changé de son point de vue) et plus rien ne serait
  // initialisé. La reconnexion du port est notre signal de reprise.
  if (currentAuthState !== null) return;
  const tabId = port.sender?.tab?.id;
  if (tabId === undefined) return;
  resolveSessionForTab(tabId)
    .catch(err => logBackgroundError("background:sendCurrentAuth:recover", err));
}

/**
 * Device flow déclenché depuis la sidebar. Seule voie d'entrée : l'action popup
 * ne fait plus qu'y renvoyer. Rien ne repart en réponse — le code d'activation
 * est diffusé à tous les onglets, y compris celui qui a cliqué.
 */
function startAuthFromPort(port: chrome.runtime.Port) {
  (async () => {
    const tabId = port.sender?.tab?.id;
    if (currentUserId === null && tabId !== undefined) {
      await resolveSessionForTab(tabId);
    }
    if (currentUserId === null) {
      // Déconnecté de Twitch entre l'affichage du bouton et le clic.
      broadcastAuth(CST.AUTH_NO_SESSION);
      return;
    }

    const userId = currentUserId;
    try {
      await tokenManager.startAuthFor(userId, broadcastDeviceCode);
      // Le polling dure des dizaines de secondes : l'utilisateur a pu changer de
      // compte entre-temps, auquel cas onSessionUserChanged a déjà diffusé
      // l'état du nouveau. Parler ici le contredirait.
      if (currentUserId !== userId) return;
      // Surtout pas onSessionUserChanged() ici : sa garde d'idempotence verrait
      // `userId === currentUserId` et ne ferait rien. Le compte n'a pas changé,
      // c'est son autorisation qui vient d'aboutir.
      // READY d'abord : inutile de faire patienter l'utilisateur derrière le
      // premier chargement Helix.
      broadcastAuth(CST.AUTH_READY);
      await initServices(userId);
    } catch (err) {
      // Code expiré, refusé, ou bascule de compte pendant le polling. Rediffuser
      // NEED_AUTH efface au passage le code périmé dans toutes les sidebars —
      // mais seulement si le compte courant est toujours celui qu'on autorisait.
      logBackgroundError("background:startAuth:deviceFlow", err);
      if (currentUserId === userId) broadcastAuth(CST.AUTH_NEED_AUTH);
    }
  })().catch(err => logBackgroundError("background:startAuth", err));
}
// Messages entrants sur un port déjà ouvert (la sidebar en maintient un).
let handlePortMessage = (message: any, port?: chrome.runtime.Port) => {
  if (message?.type === CST.START_AUTH) {
    // Passe par le port et non par chrome.runtime.onMessage : `port.sender.tab`
    // identifie l'onglet demandeur, on résout donc la session depuis CET onglet
    // plutôt que depuis l'onglet actif, qui peut être un autre.
    if (port) startAuthFromPort(port);
  } else if (message?.type === CST.DISPLAY_POPUP) {
    // La sidebar sait dans quel onglet elle vit : on cible l'onglet du port
    // plutôt que le "currentWindow actif" utilisé par le chemin action popup,
    // qui viserait le mauvais onglet si l'utilisateur en a changé.
    const tabId = port?.sender?.tab?.id;
    if (tabId === undefined) return;
    chrome.tabs.sendMessage(tabId, { type: CST.DISPLAY_POPUP }, () => {
      if (chrome.runtime.lastError) {
        logBackgroundError("background:displayPopup", chrome.runtime.lastError);
      }
    });
  } else if (message?.type === CST.OPEN_HELP_PAGE) {
    // La sidebar vit dans un content script : chrome.tabs y est indisponible,
    // et help.html n'est pas dans web_accessible_resources. L'ouverture passe
    // donc obligatoirement par ici.
    // L'ancre vient de la page appelante : on n'accepte qu'un fragment simple.
    const anchor = typeof message.value === 'string' && /^#[\w-]+$/.test(message.value)
      ? message.value
      : '';
    const url = chrome.runtime.getURL('src/iframe/help.html') + anchor;
    // Forme à callback plutôt que promesse : sur Firefox le namespace chrome.*
    // est fourni pour compatibilité et ne renvoie pas de promesse.
    chrome.tabs.create({ url }, () => {
      if (chrome.runtime.lastError) {
        logBackgroundError("background:openHelpPage", chrome.runtime.lastError);
      }
    });
  }
};

let portManager = new PortManager(sendCurrentConfigOnConnect,
                                  sendStreamInfoOnConnect,
                                  sendCurrentThemeOnConnect,
                                  sendCurrentAlignmentOnConnect,
                                sendCurrentAuth,
                                sendCurrentLocaleOnConnect,
                                handlePortMessage);

self.addEventListener('beforeunload', () => {
  portManager.closeAllPorts();
});


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    void sender;
    console.log("MESSAGE", msg.type, msg.data);

    if (msg.type === CST.SESSION_USER_CHANGED) {
      // Le content script rapporte le compte Twitch de sa page (null = déconnecté).
      const sessionUserId = msg.data ? Number(msg.data) : null;
      onSessionUserChanged(Number.isNaN(sessionUserId as number) ? null : sessionUserId)
        .catch(err => logBackgroundError("background:onSessionUserChanged", err));
      return false;
    }

    if (msg.type === CST.IS_USER_LOGGED_IN) { // Envoyé par l'action popup à son ouverture
      // La popup ne déclenche plus le device flow et n'affiche plus de code :
      // elle n'a besoin que de savoir quoi dire. `sideNavCollapsed` distingue
      // « suivez les instructions dans la sidebar » de « dépliez d'abord la
      // sidebar », faute de quoi on renverrait vers un panneau invisible.
      resolveActiveTabSession()
        .then(({ state, sideNavCollapsed }) => sendResponse({ state, sideNavCollapsed }))
        .catch(err => {
          logBackgroundError("background:isUserLoggedIn", err);
          sendResponse({ state: CST.AUTH_NOT_ON_TWITCH, sideNavCollapsed: false });
        });
      return true;
    }

    if (msg.type === CST.SAVE_CHANNELS_LIST) {
      console.log("saving channels list bg", msg.data);
      if (!configManager) return false;
      configManager.saveConfig(msg.data).then((currentConfig) => {
        portManager.sendMessageToAllTabs(CST.GET_CURRENT_CONFIGURATION, currentConfig);
      }).catch(err => logBackgroundError("background:saveConfig", err));
      return false;
    }

    if (msg.type === CST.RESET_CONFIG) {
      if (!configManager) return false;
      configManager.saveConfig(CST.createStartupConf()).then((currentConfig) => {
        portManager.sendMessageToAllTabs(CST.GET_CURRENT_CONFIGURATION, currentConfig);
      }).catch(err => logBackgroundError("background:resetConfig", err));
      return false;
    }

    if (msg.type === CST.GET_CURRENT_CONFIGURATION) {
      if (!configManager) {
        sendResponse(null);
        return false;
      }
      configManager.getConfigObjectForCurrentUser().then((currentConfig) => {
        sendResponse(currentConfig ?? null);
      }).catch(err => {
        logBackgroundError("background:getConfig", err);
        sendResponse(null);
      });
      return true;
    }

    if (msg.type === CST.DISPLAY_POPUP) {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id!, { type: CST.DISPLAY_POPUP });
      });
      return false;
    }

    if (msg.type === CST.HIDE_POPUP) {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id!, { type: CST.HIDE_POPUP });
      });
      return false;
    }

    if (msg.type === CST.CHANGE_THEME) {
      themeSombre = !themeSombre;
      sendResponse({
        type: CST.CHANGE_THEME,
        data: themeSombre
      });
      chrome.storage.local.set({
        "theme": themeSombre ? 1 : 0
      });
      chrome.tabs.query({
            url: ['https://www.twitch.tv/*']
          }, tabs => {
        console.log("UPDATE THEME " + tabs);
        for (let tab of tabs) {
          chrome.tabs.sendMessage(tab.id!, { type: CST.CHANGE_THEME, data: themeSombre });
        }
      });
      portManager.sendMessageToAllTabs(CST.CHANGE_THEME, themeSombre, "theme");
      return true;
    }

    if (msg.type === CST.GET_THEME) {
      sendResponse({
        type: CST.THEME, // RENVOYER LE TYPE NE SERT A RIEN ICI
        data: themeSombre
      });
      return true;
    }

    if (msg.type === CST.CHANGE_ALIGNMENT) {
      currentAlignmentLeft = !currentAlignmentLeft;
      sendResponse({
        type: CST.ALIGNMENT,
        data: currentAlignmentLeft
      })
      chrome.storage.local.set({
        "alignmentLeft": currentAlignmentLeft ? 1 : 0
      });
      portManager.sendMessageToAllTabs(CST.CHANGE_THEME, currentAlignmentLeft, "alignment"); // JE PARIE QUE LE TYPE NE SERT A RIEN ICI NON PLUS

      return true;
    }

    if (msg.type === CST.GET_ALIGNMENT) {
      sendResponse({
        type: CST.ALIGNMENT, // RENVOYER LE TYPE NE SERT A RIEN ICI
        data: currentAlignmentLeft
      })
      return true;
    }

    if (msg.type === CST.CHANGE_LOCALE) {
      currentLocale = msg.value;
      sendResponse({
        type: CST.LOCALE,
        data: currentLocale
      });
      chrome.storage.local.set({ "local": currentLocale });
      portManager.sendMessageToAllTabs(CST.CHANGE_LOCALE, currentLocale, "locale");
      return true;
    }

    if (msg.type === CST.GET_LOCALE) {
      sendResponse({
        type: CST.LOCALE,
        data: currentLocale
      });
      return true;
    }

  return false;
});
