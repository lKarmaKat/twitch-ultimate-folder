import PortConnector from './portConnector.js';
import { writable, derived } from 'svelte/store';
import type { StreamsInfos } from '@src/service_worker/models/streamsInfos.model';
import * as CST from '../constantes'
import type { UserConfigs, I_CONFIG } from '../service_worker/models/userStructure.js';

class ConfigManager {
    extensionId: string = "ijodiaomnnnjljemidchdifmpnnmcnlg";
    initComplete: boolean = false;
    channelsPickRef = writable<StreamsInfos[]>([]);
    // streamInfoPromise: Promise<any>;
    // currentConfigPromise;
    // channelsRef = writable([]);
    save = [];
	channelsConfigList = writable<UserConfigs>();
    currentConfigName = writable<string>('');
    selectedConfig = writable<I_CONFIG>();
    autre = derived([this.channelsConfigList, this.currentConfigName], ([$channelsConfigList, $currentConfigName]) => {
    // console.log("update");
    if ($channelsConfigList?.configsList) {
        let index = $channelsConfigList.configsList.find(conf => conf.rootList.name === $currentConfigName);
        if (index) {
            this.selectedConfig.set(index);
          // console.log("selected config", $selectedConfig, index)
          return index;
        }
        throw new Error('ConfigName not found in configList');
    }
  });
    bridge: PortConnector;
    // display = chaines;
    f : boolean = true;
    constructor() {
        // console.log("Constructeur config manager")
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
                // TODO voir si sauvegarder une liste ne vas pas écraser des données en cours de modif dans une autre popup.
                this.currentConfigName.set(msg.data.currentConfig);
                // console.log("Setting config in config manager", msg);
                if (msg.data) {
                    this.channelsConfigList.set(structuredClone(msg.data));
                }
            } else if (msg.type === CST.GET_STREAM_INFO) {
                // for(let i = 0; i < msg.data.length; i++)
                //     console.log("GET_STREAM_INFO", msg.data[i].channel_name, msg.data[i].viewer_count)

                let all = [...msg.data, CST.ALL_OTHER_CHANNELS_ELEMENT]
                all.sort(alphaSortCallback)
                
                this.channelsPickRef.set(all);
                // console.log("updating", msg.data);
                // this.save = streamInfo;
            } else if (msg.type === CST.UPDATE_STREAM_INFO) {
                // console.log("UPDATING")
                // msg.data.sort((a: StreamsInfos, b: StreamsInfos) => {
                //     let alphaSort = (a: StreamsInfos, b: StreamsInfos) => {
                //         return a.channel_name.localeCompare(b.channel_name);
                //     }
                //     if (a.isLive && b.isLive) return alphaSort(a,b);
                //     else if (a.isLive) return -1;
                //     else if (b.isLive) return 1;
                //     else return alphaSort(a,b);
                // })
                // );
                // msg.data.forEach((d: StreamsInfos) => {
                //     if (d.channel_name.toLowerCase().includes("alphacast")) {
                //         if (this.f) {
                //             d.isLive = false;
                //             this.f = !this.f
                //         } else {
                //             this.f = !this.f
                //             d.isLive = true;
                //         }
                //         console.log(d);
                //     }
                //     // if (Math.random() > 0.5) {
                //     //     d.viewer_count = d.viewer_count + 5;
                //     // } else {
                //     //     d.viewer_count = d.viewer_count - 5;
                //     // }
                // })
                // let m = new Map();
                // for (const onlineChannel of msg.data.filter((i: StreamsInfos) => i.isLive)) {
                //     m.set(onlineChannel.channel_id, onlineChannel);
                // }
                // this.channelsPickRef.update(liste => {
                //     for (let chaine in liste) {
                //         if (liste[chaine]) {
                //             // liste[chaine].viewer_count = 666;
                //             let currentRef = m.get(liste[chaine].channel_id);
                //             if (currentRef) {
                //                 liste[chaine].isLive = true;
                //                 liste[chaine].viewer_count = currentRef.viewer_count;
                //                 liste[chaine].title = currentRef.title;
                //                 liste[chaine].game_name = currentRef.game_name;
                //             } else {
                //                 liste[chaine].isLive = false;
                //                 liste[chaine].viewer_count = 0;
                //             }
                //         }
                //     }
                //     return liste;
                // })
                // console.log(" updating updating");

                // for(let i = 0; i < msg.data.length; i++)
                //     console.log("UPDATE_STREAM_INFO", msg.data[i].channel_name, msg.data[i].viewer_count)

                // this.channelsPickRef.update(e => {
                //     return e;
                // })
                let all = [...msg.data, CST.ALL_OTHER_CHANNELS_ELEMENT]
                all.sort(alphaSortCallback)
                this.channelsPickRef.set(all);
                this.channelsConfigList.update(liste => liste);
            }
        }
        // console.log("ConfigManager starting port")
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