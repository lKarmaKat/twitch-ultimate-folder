import PortConnector from './portConnector.js';
import { writable, derived } from 'svelte/store';
import type { StreamsInfos } from '@src/service_worker/models/streamsInfos.model';
import * as CST from '../constantes.js'
import type { UserConfigs, I_CONFIG } from '../service_worker/models/userStructure.js';

class ConfigManager {
    extensionId: string = "ijodiaomnnnjljemidchdifmpnnmcnlg";
    initComplete: boolean = false;
    channelsPickRef = writable<StreamsInfos[]>([]);
    bridge: PortConnector;
    save = [];
	channelsConfigList = writable<UserConfigs>();
    currentConfigName = writable<string>('');
    selectedConfig = writable<I_CONFIG>();
    autre = derived([this.channelsConfigList, this.currentConfigName], ([$channelsConfigList, $currentConfigName]) => {
    if ($channelsConfigList?.configsList) {
        let index = $channelsConfigList.configsList.find(conf => conf.rootList.name === $currentConfigName);
        if (index) {
            this.selectedConfig.set(index);
          return index;
        }
        throw new Error(`ConfigName ${$currentConfigName} not found in configList`);
    }
  });
    constructor() {
        this.startPort();
        this.autre.subscribe(e => e);
    }

    startPort() {
        let dataReceivedCallback = (msg: any) => {
            const alphaSortCallback = (a: StreamsInfos, b: StreamsInfos) => {
                    let alphaSort = (a: StreamsInfos, b: StreamsInfos) => {
                        return a.channel_name.localeCompare(b.channel_name);
                    }
                    if (a.id === CST.ALL_OTHER_CHANNELS)
                        return -1;
                    else if (b.id === CST.ALL_OTHER_CHANNELS)
                        return 1;
                    else if (a.isLive && b.isLive) return alphaSort(a,b);
                    else if (a.isLive) return -1;
                    else if (b.isLive) return 1;
                    else return alphaSort(a,b);
                };
            if (msg.type === CST.GET_CURRENT_CONFIGURATION) {
                this.currentConfigName.set(msg.data.currentConfig);
                if (msg.data) {
                    this.channelsConfigList.set(structuredClone(msg.data));
                }
            } else if (msg.type === CST.GET_STREAM_INFO) {
                let all = [...msg.data, CST.ALL_OTHER_CHANNELS_ELEMENT]
                all.sort(alphaSortCallback)
                
                this.channelsPickRef.set(all);
            } else if (msg.type === CST.UPDATE_STREAM_INFO) {
                let all = [...msg.data, CST.ALL_OTHER_CHANNELS_ELEMENT]
                all.sort(alphaSortCallback)
                this.channelsPickRef.set(all);
                this.channelsConfigList.update(liste => liste);
            }
        }
        this.bridge = new PortConnector(dataReceivedCallback);
    }

    getConfig() {
        return {
            channelsConfig: this.channelsConfigList,
            channelsPickRef: this.channelsPickRef,
            selectedConfig: this.selectedConfig
        }
    }



    send(toSaveChannels: I_CONFIG) {
        let copy = this.cleanRecursively('rootList', toSaveChannels);  
        chrome.runtime.sendMessage(this.extensionId, { type: CST.SAVE_CHANNELS_LIST, data: copy });
    }

    cleanRecursively(listId: string, toSaveChannels: I_CONFIG) {
        let copy = JSON.parse(JSON.stringify(toSaveChannels));
        if (copy[listId].items.length > 0) {
            for (let item of copy[listId].items) {
                if ((item as any).type === CST.TYPE_LIST) {
                    this.cleanRecursively((item as any).id, copy);
                } else {
                    delete (item as any).channel_name;
                    delete (item as any).game_name;
                    delete (item as any).isLive;
                    delete (item as any).language;
                    delete (item as any).profile_image_url;
                    delete (item as any).title;
                    delete (item as any).viewer_count;
                }
            }
        }
        return copy;
    }

    resetConfig() {
        return new Promise(resolve => {
            chrome.runtime.sendMessage(this.extensionId, {type: CST.RESET_CONFIG}, () => {
                console.log("reseted");
                chrome.runtime.sendMessage(this.extensionId, {type: CST.GET_CURRENT_CONFIGURATION}, (truc) => {
                    if (Object.getOwnPropertyNames(truc)?.length > 0) {
                        this.channelsConfigList = writable(truc);
                        // display = truc;
                    }
                    resolve(this.channelsConfigList);
                });
            });
        });
    }


}

export default ConfigManager;