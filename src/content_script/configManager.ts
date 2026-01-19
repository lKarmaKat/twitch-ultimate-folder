import PortConnector from './portConnector.js';
import { writable } from 'svelte/store';
import type { StreamsInfos } from '@src/service_worker/models/streamsInfos.model';
import * as CST from '../constantes'
import type { UserConfigs } from '../service_worker/models/userStructure.js';

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

    constructor() {
        // console.log("Constructeur config manager")
        this.startPort();
    }

    startPort() {
        let dataReceivedCallback = (msg: any) => {
            if (msg.type === "GET_CURRENT_CONFIGURATION") {
                // TODO voir si sauvegarder une liste ne vas pas écraser des données en cours de modif dans une autre popup.
                this.currentConfig.set(msg.data.currentConfig);
                console.log("Setting config in config manager", msg);
                if (msg.data) {
                    this.channelsConfig.set(structuredClone(msg.data));
                }
            } else if (msg.type === "GET_STREAM_INFO") {
                msg.data.sort((a: StreamsInfos, b: StreamsInfos) => {
                    let alphaSort = (a: StreamsInfos, b: StreamsInfos) => {
                        return a.channel_name.localeCompare(b.channel_name);
                    }
                    if (a.isLive && b.isLive) return alphaSort(a,b);
                    else if (a.isLive) return -1;
                    else if (b.isLive) return 1;
                    else return alphaSort(a,b);
                })
                this.channelsPickRef.set(msg.data);
                // console.log("updating", msg.data);
                // this.save = streamInfo;
            } else if (msg.type === "UPDATE_STREAM_INFO") {
                msg.data.sort((a: StreamsInfos, b: StreamsInfos) => {
                    let alphaSort = (a: StreamsInfos, b: StreamsInfos) => {
                        return a.channel_name.localeCompare(b.channel_name);
                    }
                    if (a.isLive && b.isLive) return alphaSort(a,b);
                    else if (a.isLive) return -1;
                    else if (b.isLive) return 1;
                    else return alphaSort(a,b);
                })
                // );
                let m = new Map();
                for (const onlineChannel of msg.data.filter((i: StreamsInfos) => i.isLive)) {
                    m.set(onlineChannel.channel_id, onlineChannel.viewer_count);
                }
                this.channelsPickRef.update(liste => {
                    for (let chaine in liste) {
                        if (liste[chaine].isLive) {
                            liste[chaine].viewer_count = m.get(liste[chaine].channel_id);
                        }
                    }
                    return liste;
                })
                this.channelsConfig.update(liste => liste);
                // console.log(" updating updating");
                this.channelsPickRef.update(e => {
                    // console.log(e)
                    return e;
                })
            }
        }
        // console.log("starting port")
        this.bridge = new PortConnector(dataReceivedCallback);
    }

    getConfig() {
        return {
            channelsConfig: this.channelsConfig,
            channelsPickRef: this.channelsPickRef
        }
    }



    send(toSaveChannels: UserConfigs) {
        chrome.runtime.sendMessage(this.extensionId, { type: 'SAVE_CHANNELS_LIST', data: toSaveChannels });
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