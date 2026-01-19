import { DataFormatter } from './dataFormatter'
import { TwitchApi } from './twitch';
import PortManager from './portManager'
import { ConfigManager } from './configManage';
import { TokenManager } from "./token";
import * as CST from '../constantes.js'
import { writable } from 'svelte/store';
import type { UserConfigs } from './models/userStructure'

const userUpdate = writable(false);
const userAuthAutoFailed = writable(false);

let tokenManager = new TokenManager(userUpdate, userAuthAutoFailed);
let twitchApi = new TwitchApi(tokenManager);
let configManager = new ConfigManager(twitchApi, userUpdate);
let dataFormatter = new DataFormatter(twitchApi);

console.log("####################");
console.log("Background.js");
console.log("####################");


setInterval(() => {
  dataFormatter.updateAll().then((info) => {
    //console.log("updating bg", info);
    portManager.sendMessageToAllTabs(CST.UPDATE_STREAM_INFO, info);
  })
}, 6000);



let sendStreamInfoOnConnect = (port: chrome.runtime.Port) => {
    dataFormatter.updateAll().then((info) => {
    // console.log("updating bg");
    port.postMessage({ 
      "type": CST.GET_STREAM_INFO, 
      "data": info
    });
    return;
  })
};

let sendCurrentConfigOnConnect = (port: chrome.runtime.Port) => {
    configManager.getConfigObjectForCurrentUser().then((currentConfig) => {
      port.postMessage({
        "type": CST.GET_CURRENT_CONFIGURATION,
        "data": currentConfig
      })
    });
}

let themeSombre = true;
chrome.storage.local.get("theme").then((data) => {
  themeSombre = data.theme === 1 ? true : false;
});
let sendCurrentTheme = (port: chrome.runtime.Port) => {
  port.postMessage({
    "type": "theme",
    "data": themeSombre
  });
}

let portManager = new PortManager(sendCurrentConfigOnConnect, sendStreamInfoOnConnect, sendCurrentTheme);

self.addEventListener('beforeunload', () => {
  portManager.closeAllPorts();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log("MESSAGE", msg.type, msg.data);    
if (msg.type === CST.GET_STREAM_INFO) {
    dataFormatter.init().then((info) => {
      sendResponse(info);
    })
    return true;
  } else if (msg.type === CST.SAVE_CHANNELS_LIST) {
    // nettoyer input
    console.log("saving channels list bg", msg.data);
    // chrome.storage.local.set({ currentConfig: msg.data});
    configManager.saveConfig(msg.data);
    // portManager.sendMessageToAllTabs(CST.GET_CURRENT_CONFIGURATION, msg.data)
    return false;
  }
  else if (msg.type === CST.RESET_CONFIG) {
      let resetConf = CST.STARTUP_CONF;
      chrome.storage.local.set({currentConfig: resetConf});
    return false;
  } else if (msg.type === CST.GET_CURRENT_CONFIGURATION) {
    configManager.getConfigObjectForCurrentUser().then((currentConfig) => {
      sendResponse(currentConfig);
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
  else if (msg.type === CST.THEME) {
    themeSombre = !themeSombre;
    sendResponse({
      type: CST.THEME,
      data: themeSombre
    });
    chrome.storage.local.set({
      "theme": themeSombre ? 1 : 0
    });
    portManager.sendMessageToTabs(CST.THEME, themeSombre, "theme");
    return true;
  }
  else if (msg.type === CST.GET_THEME) {
    sendResponse({
      type: CST.THEME,
      data: themeSombre
    });
    return true;
  }
});


chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg.type === CST.GET_STREAM_INFO) {
    dataFormatter.init().then((info) => {
      sendResponse(info);
    })
    return true;
  } else if (msg.type === CST.GET_CURRENT_CONFIGURATION) {
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
});


