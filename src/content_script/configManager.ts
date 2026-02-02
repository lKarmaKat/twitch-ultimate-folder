import PortConnector from './portConnector.js';
import { writable } from 'svelte/store';
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
	channelsConfig = writable<UserConfigs>();
    currentConfig = writable<string>('');
    bridge: PortConnector;
    // display = chaines;
    f : boolean = true;
    constructor() {
        // console.log("Constructeur config manager")
        this.startPort();
    }

    startPort() {
        let dataReceivedCallback = (msg: any) => {
            const alphaSortCallback = (a: StreamsInfos, b: StreamsInfos) => {
                    let alphaSort = (a: StreamsInfos, b: StreamsInfos) => {
                        return a.channel_name.localeCompare(b.channel_name);
                    }
                    if (a.isLive && b.isLive) return alphaSort(a,b);
                    else if (a.isLive) return -1;
                    else if (b.isLive) return 1;
                    else return alphaSort(a,b);
                };
            if (msg.type === "GET_CURRENT_CONFIGURATION") {
                // TODO voir si sauvegarder une liste ne vas pas écraser des données en cours de modif dans une autre popup.
                this.currentConfig.set(msg.data.currentConfig);
                // console.log("Setting config in config manager", msg);
                if (msg.data) {
                    this.channelsConfig.set(structuredClone(msg.data));
                }
            } else if (msg.type === "GET_STREAM_INFO") {

                msg.data.sort(alphaSortCallback)
                this.channelsPickRef.set(msg.data);
                // console.log("updating", msg.data);
                // this.save = streamInfo;
            } else if (msg.type === "UPDATE_STREAM_INFO") {
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
                // this.channelsPickRef.update(e => {
                //     // console.log(e)
                //     return e;
                // })
                
                msg.data.sort(alphaSortCallback);
                this.channelsPickRef.set(msg.data);
                this.channelsConfig.update(liste => liste);
            }
        }
        // console.log("ConfigManager starting port")
        this.bridge = new PortConnector(dataReceivedCallback);
    }

    getConfig() {
        return {
            channelsConfig: this.channelsConfig,
            channelsPickRef: this.channelsPickRef
        }
    }



    send(toSaveChannels: I_CONFIG) {
        let copy = this.cleanRecursively('rootList', toSaveChannels);  
        chrome.runtime.sendMessage(this.extensionId, { type: 'SAVE_CHANNELS_LIST', data: copy });
    }

    cleanRecursively(listId: string, toSaveChannels: I_CONFIG) {
        let copy = JSON.parse(JSON.stringify(toSaveChannels));
        if (copy[listId].items.length > 0) {
            for (let item of copy[listId].items) {
                if ((item as any).type === 'liste') {
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
            chrome.runtime.sendMessage(this.extensionId, {type: 'RESET_CONFIG'}, () => {
                console.log("reseted");
                chrome.runtime.sendMessage(this.extensionId, {type: 'GET_CURRENT_CONFIGURATION'}, (truc) => {
                    if (Object.getOwnPropertyNames(truc)?.length > 0) {
                        this.channelsConfig = writable(truc);
                        // display = truc;
                    }
                    resolve(this.channelsConfig);
                });
            });
        });
    }


}

export default ConfigManager;