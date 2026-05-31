import { TwitchApi } from './twitch';
import PortManager from './portManager'
import { ConfigManager } from './configManage';
import { TokenManager } from "./token";
import { logErrorChain, wrapError } from "./errors";
import * as CST from '../constantes.js'
import { writable } from 'svelte/store';
import { DataPoller } from './dataPoller';
import type { StreamsInfos } from './models/streamsInfos.model';

const userUpdate = writable(false);
const userAuthAutoFailed = writable(false);

let tokenManager = new TokenManager(userUpdate, userAuthAutoFailed);
let twitchApi = new TwitchApi(tokenManager);
let configManager = new ConfigManager(twitchApi, userUpdate);
let streamsDatasPoller = new DataPoller(twitchApi, (data: StreamsInfos[]) => {
  portManager.sendMessageToAllTabs(CST.GET_STREAMS_REF, data);
});

const logBackgroundError = (context: string, error: unknown) => {
  logErrorChain(context, error);
};

console.log("####################");
console.log("Background.js");
console.log("####################");




let sendStreamInfoOnConnect = (port: chrome.runtime.Port) => {
    streamsDatasPoller.getConfig().then((info) => {
    // console.log("updating bg");
    port.postMessage({ 
      "type": CST.GET_STREAMS_REF, 
      "data": info
    });
  }).catch((error) => {
    logBackgroundError("background:sendStreamInfoOnConnect", wrapError("Background failed to send stream info on connect", error));
  });
};

let sendCurrentConfigOnConnect = (port: chrome.runtime.Port) => {
    configManager.getConfigObjectForCurrentUser().then((currentConfig) => {
      port.postMessage({
        "type": CST.GET_CURRENT_CONFIGURATION,
        "data": currentConfig
      })
    }).catch(err => {
      logBackgroundError("background:sendCurrentConfigOnConnect", err)
    });
}

let themeSombre = true;
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
  currentAlignmentLeft = data.currentAlignment === 1 ? true : false;
})
let sendCurrentAlignmentOnConnect = (port: chrome.runtime.Port) => {
  port.postMessage({
    "type": CST.THEME, // RENVOYER LE TYPE NE SERT A RIEN ICI
    "data": currentAlignmentLeft
  });
}


let portManager = new PortManager(sendCurrentConfigOnConnect, sendStreamInfoOnConnect, sendCurrentThemeOnConnect, sendCurrentAlignmentOnConnect);

self.addEventListener('beforeunload', () => {
  portManager.closeAllPorts();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    void sender;
    console.log("MESSAGE", msg.type, msg.data);    
  if (msg.type === CST.SAVE_CHANNELS_LIST) {
    console.log("saving channels list bg", msg.data);
    configManager.saveConfig(msg.data).then((currentConfig) => {
      portManager.sendMessageToAllTabs(CST.GET_CURRENT_CONFIGURATION, currentConfig);
    }).catch(err => logBackgroundError("background:saveConfig", err));
    return false;
  }
  else if (msg.type === CST.RESET_CONFIG) {
      let resetConf = CST.STARTUP_CONF;
      // chrome.storage.local.set({currentConfig: resetConf});
      configManager.saveConfig(resetConf);
      portManager.sendMessageToAllTabs(CST.GET_CURRENT_CONFIGURATION, resetConf)
      // sendResponse(resetConf);
    return false;
  } else if (msg.type === CST.GET_CURRENT_CONFIGURATION) {
    configManager.getConfigObjectForCurrentUser().then((currentConfig) => {
      sendResponse(currentConfig);
    }).catch(err => {
      logBackgroundError("background:sendCurrentConfigOnConnect", err)
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
  }

  return false;
});


chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  void sender;
  if (msg.type === CST.GET_CURRENT_CONFIGURATION) {
    console.log("getting current conf");
    (async () => {
        chrome.storage.local.get('currentConfig', (data) => {
            if (data?.currentConfig) {
                sendResponse(data?.currentConfig);
            }
        });
    })();
    return true;
  }

  return false;
});


