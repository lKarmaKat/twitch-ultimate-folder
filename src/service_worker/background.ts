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

// Twitch account logged into the browser, as reported by the content script.
// Nothing is set at worker startup: we don't know yet WHO is logged in.
let currentUserId: number | null = null;
// null = state not established yet; pages read it as "pending" and show their
// loading screen instead of a bogus "logged out".
let currentAuthState: string | null = null;
// An account switch hits the network, so two close switches can finish out of
// order: this counter lets only the latest one write the final state.
let switchEpoch = 0;

function broadcastAuth(state: string) {
  currentAuthState = state;
  portManager.sendMessageToAllTabs(CST.AUTH_STATE, state, "auth");
}

/**
 * Broadcasts the activation code to EVERY open sidebar, not just the clicked
 * one: with several Twitch tabs, the code must be enterable from any of them.
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
 * Single entry point for Twitch session changes (login, logout, switch). The
 * whole pipeline is rebuilt here, never anywhere else.
 */
async function onSessionUserChanged(sessionUserId: number | null) {
  // Idempotent: every tab reports the same session. The currentAuthState test
  // still lets the very first call through, "no session" (null) included.
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
  if (epoch !== switchEpoch) return; // a more recent switch took over

  if (!hasToken) {
    broadcastAuth(CST.AUTH_NEED_AUTH);
    return;
  }

  // READY as soon as the token works, WITHOUT waiting for initServices: its
  // first full Helix load takes seconds, and pages already show "pending data".
  broadcastAuth(CST.AUTH_READY);
  await initServices(sessionUserId);
}

// Token became unrecoverable mid-session (revoked from Twitch settings, say):
// stop the poller and ask for authorization instead of looping on 401s.
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

    // Catch-up for ports that connected before auth was ready
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

// Callback form rather than promise: on Firefox the chrome.* namespace is a
// compatibility shim and returns no promise.
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
  /** Twitch sidebar collapsed: the authorization panel is invisible there. */
  sideNavCollapsed: boolean;
  /** Twitch's own theme, read from the page. null when no tab answered. */
  twitchDark: boolean | null;
}

function askTabForSession(tabId: number): Promise<TabSession> {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(tabId, { type: CST.GET_SESSION_USER }, (response) => {
      // No content script on the other end (page not loaded yet, or tab opened
      // before install): lastError, not a crash.
      if (chrome.runtime.lastError || !response) {
        return resolve({ userId: null, sideNavCollapsed: false, twitchDark: null });
      }
      resolve({
        userId: typeof response.userId === 'string' ? response.userId : null,
        sideNavCollapsed: response.sideNavCollapsed === true,
        twitchDark: typeof response.twitchDark === 'boolean' ? response.twitchDark : null
      });
    });
  });
}

/**
 * Restarts the pipeline from a given tab. Used when the worker was killed:
 * `currentUserId` is lost, but the tab sees no session change to report.
 */
async function resolveSessionForTab(tabId: number): Promise<TabSession> {
  const session = await askTabForSession(tabId);
  // Unconditional call: onSessionUserChanged's idempotence guard already tells
  // "nothing changed" apart from "state never established".
  await onSessionUserChanged(session.userId ? Number(session.userId) : null);
  return session;
}

/**
 * State to show in the action popup, resolved on demand from the ACTIVE tab —
 * not from `currentUserId`, which an MV3 worker loses when it is killed.
 */
async function resolveActiveTabSession(): Promise<{ state: string; sideNavCollapsed: boolean; twitchDark: boolean | null }> {
  const tab = await queryActiveTab();
  if (!tab?.url || !tab.url.startsWith('https://www.twitch.tv/') || tab.id === undefined) {
    // Only case with nothing to report: the popup falls back to the OS theme.
    return { state: CST.AUTH_NOT_ON_TWITCH, sideNavCollapsed: false, twitchDark: null };
  }

  // Worker just woke up, or a session appeared while it slept: rebuild the
  // pipeline BEFORE answering, or we'd re-prompt an already-authorized user.
  const session = await resolveSessionForTab(tab.id);
  // No Twitch session, but the tab did answer: its theme still holds.
  if (!session.userId) {
    return { state: CST.AUTH_NO_SESSION, sideNavCollapsed: false, twitchDark: session.twitchDark };
  }

  return {
    state: currentUserId !== null && tokenManager.token ? CST.AUTH_READY : CST.AUTH_NEED_AUTH,
    sideNavCollapsed: session.sideNavCollapsed,
    twitchDark: session.twitchDark
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

// The theme is no longer a preference: drop the key older versions stored.
chrome.storage.local.remove("theme");

let currentAlignmentLeft = true;
chrome.storage.local.get("alignmentLeft").then((data) => {
  currentAlignmentLeft = data.alignmentLeft === 0 ? false : true ;
})
let sendCurrentAlignmentOnConnect = (port: chrome.runtime.Port) => {
  port.postMessage({
    "type": CST.ALIGNMENT,
    "data": currentAlignmentLeft
  });
}

// Side the channel title pops up on, independent of the list alignment above.
let currentTitleSideLeft = false;
const titleSideReady = chrome.storage.local.get(CST.PARAM_TITLE_SIDE_LEFT).then((data) => {
  currentTitleSideLeft = data[CST.PARAM_TITLE_SIDE_LEFT] === 1;
}).catch(err => logBackgroundError("background:readTitleSide", err));
let sendCurrentTitleSideOnConnect = (port: chrome.runtime.Port) => {
  // The storage read is async: a port connecting while the worker wakes up
  // would otherwise be told the default instead of the stored value.
  titleSideReady.then(() => {
    port.postMessage({
      "type": CST.TITLE_SIDE,
      "data": currentTitleSideLeft
    });
  }).catch(err => logBackgroundError("background:sendCurrentTitleSideOnConnect", err));
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

  // Tab opened (or reloaded) DURING a device flow started elsewhere: it missed
  // the broadcast. Must come after AUTH_STATE, which clears the sidebar's code.
  const pending = tokenManager.currentDeviceCodeInfo;
  if (pending?.user_code) {
    port.postMessage({
      "type": CST.AUTH_DEVICE_CODE,
      "data": { user_code: pending.user_code, verification_uri: pending.verification_uri }
    });
  }

  // The worker may have been killed and restarted while the tab stayed open, so
  // the content script has no session change to report: the port is our signal.
  if (currentAuthState !== null) return;
  const tabId = port.sender?.tab?.id;
  if (tabId === undefined) return;
  resolveSessionForTab(tabId)
    .catch(err => logBackgroundError("background:sendCurrentAuth:recover", err));
}

/**
 * Device flow started from the sidebar, the only entry point. Nothing is
 * returned: the activation code is broadcast to every tab, clicker included.
 */
function startAuthFromPort(port: chrome.runtime.Port) {
  (async () => {
    const tabId = port.sender?.tab?.id;
    if (currentUserId === null && tabId !== undefined) {
      await resolveSessionForTab(tabId);
    }
    if (currentUserId === null) {
      // Logged out of Twitch between the button showing up and the click.
      broadcastAuth(CST.AUTH_NO_SESSION);
      return;
    }

    const userId = currentUserId;
    try {
      await tokenManager.startAuthFor(userId, broadcastDeviceCode);
      // Polling lasts tens of seconds: the user may have switched account, in
      // which case onSessionUserChanged already broadcast the new state.
      if (currentUserId !== userId) return;
      // Not onSessionUserChanged() here: its idempotence guard would see
      // `userId === currentUserId` and do nothing. Only the authorization moved.
      broadcastAuth(CST.AUTH_READY);
      await initServices(userId);
    } catch (err) {
      // Code expired, denied, or account switched mid-polling. Re-broadcasting
      // NEED_AUTH also clears the stale code in every sidebar.
      logBackgroundError("background:startAuth:deviceFlow", err);
      if (currentUserId === userId) broadcastAuth(CST.AUTH_NEED_AUTH);
    }
  })().catch(err => logBackgroundError("background:startAuth", err));
}
// Messages arriving on an already open port (the sidebar keeps one).
let handlePortMessage = (message: any, port?: chrome.runtime.Port) => {
  if (message?.type === CST.START_AUTH) {
    // Via the port, not chrome.runtime.onMessage: `port.sender.tab` identifies
    // the requesting tab, which may not be the active one.
    if (port) startAuthFromPort(port);
  } else if (message?.type === CST.DISPLAY_POPUP) {
    // The sidebar knows which tab it lives in, so target the port's tab rather
    // than the active one used by the action popup path.
    const tabId = port?.sender?.tab?.id;
    if (tabId === undefined) return;
    chrome.tabs.sendMessage(tabId, { type: CST.DISPLAY_POPUP }, () => {
      if (chrome.runtime.lastError) {
        logBackgroundError("background:displayPopup", chrome.runtime.lastError);
      }
    });
  } else if (message?.type === CST.OPEN_HELP_PAGE) {
    // The sidebar lives in a content script: no chrome.tabs there, and
    // help.html is not web-accessible, so opening it must go through here.
    // The anchor comes from the caller: only a plain fragment is accepted.
    const anchor = typeof message.value === 'string' && /^#[\w-]+$/.test(message.value)
      ? message.value
      : '';
    // Query before fragment, or the param lands inside the anchor.
    const dark = message.dark === true ? 1 : 0;
    const url = `${chrome.runtime.getURL('src/iframe/help.html')}?dark=${dark}${anchor}`;
    // Callback form rather than promise: on Firefox the chrome.* namespace is
    // a compatibility shim and returns no promise.
    chrome.tabs.create({ url }, () => {
      if (chrome.runtime.lastError) {
        logBackgroundError("background:openHelpPage", chrome.runtime.lastError);
      }
    });
  }
};

let portManager = new PortManager(sendCurrentConfigOnConnect,
                                  sendStreamInfoOnConnect,
                                  sendCurrentAlignmentOnConnect,
                                sendCurrentAuth,
                                sendCurrentLocaleOnConnect,
                                handlePortMessage);
portManager.registerOnConnect('titleSide', sendCurrentTitleSideOnConnect);

self.addEventListener('beforeunload', () => {
  portManager.closeAllPorts();
});


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    void sender;
    console.log("MESSAGE", msg.type, msg.data);

    if (msg.type === CST.SESSION_USER_CHANGED) {
      // The content script reports its page's Twitch account (null = logged out).
      const sessionUserId = msg.data ? Number(msg.data) : null;
      onSessionUserChanged(Number.isNaN(sessionUserId as number) ? null : sessionUserId)
        .catch(err => logBackgroundError("background:onSessionUserChanged", err));
      return false;
    }

    if (msg.type === CST.IS_USER_LOGGED_IN) { // Sent by the action popup on open
      // The popup no longer runs the device flow, it only needs to know what to
      // say. `sideNavCollapsed` tells "see the sidebar" from "expand it first".
      resolveActiveTabSession()
        .then(({ state, sideNavCollapsed, twitchDark }) => sendResponse({ state, sideNavCollapsed, twitchDark }))
        .catch(err => {
          logBackgroundError("background:isUserLoggedIn", err);
          sendResponse({ state: CST.AUTH_NOT_ON_TWITCH, sideNavCollapsed: false, twitchDark: null });
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

    if (msg.type === CST.CHANGE_ALIGNMENT) {
      currentAlignmentLeft = !currentAlignmentLeft;
      sendResponse({
        type: CST.ALIGNMENT,
        data: currentAlignmentLeft
      })
      chrome.storage.local.set({
        "alignmentLeft": currentAlignmentLeft ? 1 : 0
      });
      portManager.sendMessageToAllTabs(CST.ALIGNMENT, currentAlignmentLeft, "alignment");

      return true;
    }

    if (msg.type === CST.GET_ALIGNMENT) {
      sendResponse({
        type: CST.ALIGNMENT, // SENDING THE TYPE BACK IS POINTLESS HERE
        data: currentAlignmentLeft
      })
      return true;
    }

    if (msg.type === CST.CHANGE_TITLE_SIDE) {
      // Explicit value rather than a blind toggle: two popups, or a restarted
      // worker, would otherwise drift out of sync.
      currentTitleSideLeft = msg.value === true;
      sendResponse({
        type: CST.TITLE_SIDE,
        data: currentTitleSideLeft
      });
      chrome.storage.local.set({
        [CST.PARAM_TITLE_SIDE_LEFT]: currentTitleSideLeft ? 1 : 0
      });
      portManager.sendMessageToAllTabs(CST.TITLE_SIDE, currentTitleSideLeft, "titleSide");

      return true;
    }

    if (msg.type === CST.GET_TITLE_SIDE) {
      titleSideReady.then(() => {
        sendResponse({
          type: CST.TITLE_SIDE,
          data: currentTitleSideLeft
        });
      });
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
