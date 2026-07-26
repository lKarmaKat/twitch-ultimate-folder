import { TwitchApi } from './twitch';
import PortManager from './portManager'
import { ConfigManager } from './configManage';
import { TokenManager } from "./token";
import { logErrorChain, wrapError } from "./errors";
import * as CST from '../constantes.js'
import { DataPusher } from './dataPusher';
import type { StreamsInfos } from './models/streamsInfos.model';

const logBackgroundError = (context: string, error: unknown) => {
  logErrorChain(context, error);
};

console.log("####################");
console.log("Background.js");
console.log("####################");

const tokenManager = new TokenManager(
    (userId) => initServices(userId),
    () => {},
    () => {
      portManager.sendMessageToAllTabs("", false, "auth")
      console.log("No Token found, has yet to be implemented")
      return true
    }
);
// setTimeout(() => {
  tokenManager.getTokenFromStorage();
// }, 8000)
let twitchApi: TwitchApi | null = null;
let configManager: ConfigManager | null = null;
let streamsDatasPoller: DataPusher | null = null;

async function initServices(userId: number) {
    console.log("BACKGROUND initService")
    twitchApi = new TwitchApi(tokenManager);
    configManager = new ConfigManager(twitchApi);
    configManager.initConfigWithUser(userId);
    streamsDatasPoller = new DataPusher(twitchApi, (data: StreamsInfos[]) => {
        portManager.sendMessageToAllTabs(CST.GET_STREAMS_REF, data);
    });

    // Rattrapage pour les ports connectés avant que l'auth soit prête
    try {
        const [currentConfig, streamInfo] = await Promise.all([
            configManager.getConfigObjectForCurrentUser(),
            streamsDatasPoller.getConfig()
        ]);
        portManager.sendMessageToAllTabs("", true, "auth")

        if (currentConfig) portManager.sendMessageToAllTabs(CST.GET_CURRENT_CONFIGURATION, currentConfig);
        if (streamInfo) portManager.sendMessageToAllTabs(CST.GET_STREAMS_REF, streamInfo);
    } catch (e) {
        logBackgroundError("initServices:initialBroadcast", e);
    }
}








// let tokenManager = new TokenManager(userDisconnected, (info) => {
//   portManager.sendMessageToAllTabs(CST.AUTH_DEVICE_CODE, info, 'auth');
// });
// let twitchApi = new TwitchApi(tokenManager);
// let configManager = new ConfigManager(twitchApi);
// let streamsDatasPoller = new DataPoller(twitchApi, (data: StreamsInfos[]) => {
//   portManager.sendMessageToAllTabs(CST.GET_STREAMS_REF, data);
// });






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
    "type": "", // RENVOYER LE TYPE NE SERT A RIEN ICI
    "data": tokenManager.token ? true : false
  });
}
// Messages entrants sur un port déjà ouvert (la sidebar en maintient un).
let handlePortMessage = (message: any) => {
  if (message?.type === CST.OPEN_OPTIONS_PAGE) {
    // TODO: nécessite une page d'options — déclarer "options_ui" dans
    // public/manifest.json et créer la page. Sans ça, l'appel rejette.
    chrome.runtime.openOptionsPage()
      .catch(err => logBackgroundError("background:openOptionsPage", err));
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

// userUpdate.subscribe((userValid: boolean) => {
//   if (!userValid) return;
//   configManager.getConfigObjectForCurrentUser()
//     .then((currentConfig) => {
//       if (currentConfig) portManager.sendMessageToAllTabs(CST.GET_CURRENT_CONFIGURATION, currentConfig);
//     })
//     .catch(err => logBackgroundError("background:userUpdate:sendConfig", err));
// });

self.addEventListener('beforeunload', () => {
  portManager.closeAllPorts();
});

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    void sender;
    console.log("MESSAGE", msg.type, msg.data);    
    if( msg.type === CST.IS_USER_LOGGED_IN) {
      if (tokenManager.token) {
        sendResponse(true);
      } else if (tokenManager.currentDeviceCodeInfo?.user_code && tokenManager.currentDeviceCodeInfo?.verification_uri) {
        sendResponse({ 
                user_code: tokenManager.currentDeviceCodeInfo?.user_code,
                verification_uri: tokenManager.currentDeviceCodeInfo?.verification_uri
        });
      } else {
        const info = await new Promise<any>(resolve => {
          tokenManager.initAuthentification((info: any) => {
            resolve(info);
          })
        })
        sendResponse(info)      
      }
    return true;
    } else if (msg.type === CST.SAVE_CHANNELS_LIST) {
    console.log("saving channels list bg", msg.data);
    configManager!.saveConfig(msg.data).then((currentConfig) => {
      portManager.sendMessageToAllTabs(CST.GET_CURRENT_CONFIGURATION, currentConfig);
    }).catch(err => logBackgroundError("background:saveConfig", err));
    return false;
  }
  else if (msg.type === CST.RESET_CONFIG) {
    configManager!.saveConfig(CST.createStartupConf()).then((currentConfig) => {
      portManager.sendMessageToAllTabs(CST.GET_CURRENT_CONFIGURATION, currentConfig);
    }).catch(err => logBackgroundError("background:resetConfig", err));
    return false;
  } else if (msg.type === CST.GET_CURRENT_CONFIGURATION) {
    configManager!.getConfigObjectForCurrentUser().then((currentConfig) => {
      sendResponse(currentConfig ?? null);
    }).catch(err => {
      logBackgroundError("background:getConfig", err)
    });
    return true;
  } else if (msg.type === CST.DISPLAY_POPUP) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id!, { type: CST.DISPLAY_POPUP });
    });
    return false;
  } else if (msg.type === CST.HIDE_POPUP) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id!, { type: CST.HIDE_POPUP });
    });
    return false;
  } 
  else if (msg.type === CST.CHANGE_THEME) {
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
  else if (msg.type === CST.GET_THEME) {
    sendResponse({
      type: CST.THEME, // RENVOYER LE TYPE NE SERT A RIEN ICI
      data: themeSombre
    });
    return true;
  } else if (msg.type === CST.CHANGE_ALIGNMENT) {
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
  } else if (msg.type === CST.GET_ALIGNMENT) {
    sendResponse({
      type: CST.ALIGNMENT, // RENVOYER LE TYPE NE SERT A RIEN ICI
      data: currentAlignmentLeft
    })
    return true;
  } else if (msg.type === CST.CHANGE_LOCALE) {
    currentLocale = msg.value;
    sendResponse({
      type: CST.LOCALE,
      data: currentLocale
    });
    chrome.storage.local.set({ "local": currentLocale });
    portManager.sendMessageToAllTabs(CST.CHANGE_LOCALE, currentLocale, "locale");
    return true;
  } else if (msg.type === CST.GET_LOCALE) {
    sendResponse({
      type: CST.LOCALE,
      data: currentLocale
    });
    return true;
  }

  return false;
});

// dead code from the time when svelte/configManager would send a message to reset config then ask for current config
// chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
//   void sender;
//   if (msg.type === CST.GET_CURRENT_CONFIGURATION) {
//     console.log("getting current conf");
//     (async () => {
//         chrome.storage.local.get('currentConfig', (data) => {
//             if (data?.currentConfig) {
//                 sendResponse(data?.currentConfig);
//             }
//         });
//     })();
//     return true;
//   }

//   return false;
// });


