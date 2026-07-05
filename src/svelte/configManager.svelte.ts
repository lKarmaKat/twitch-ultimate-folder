import PortConnector from './portConnector.svelte.js';
import type { StreamsInfos } from '@src/service_worker/models/streamsInfos.model';
import * as CST from '../constantes.js'
import type { UserConfigs, I_CONFIG } from '../service_worker/models/userStructure.js';
import { SvelteMap } from 'svelte/reactivity';

class ConfigManager {
    extensionId: string = "ijodiaomnnnjljemidchdifmpnnmcnlg";
    initComplete: boolean = false;
    channelsPickRefMap = new SvelteMap<string, StreamsInfos>();
    channelsPickRef = $derived.by(() => {
        let channelsList = Array.from(this.channelsPickRefMap.values());
        // channelsList.push(CST.ALL_OTHER_CHANNELS_ELEMENT);
        
        const alphaSortCallback = (a: StreamsInfos, b: StreamsInfos) => {
                    let alphaSort = (a: StreamsInfos, b: StreamsInfos) => {
                        return a.channel_name.localeCompare(b.channel_name);
                    }
                    // if (a.id === CST.ALL_OTHER_CHANNELS)
                    if (a.id < 0 )
                        return -1;
                    // else if (b.id === CST.ALL_OTHER_CHANNELS)
                    else if (b.id < 0)
                        return 1;
                    else if (a.isLive && b.isLive) return alphaSort(a,b);
                    else if (a.isLive) return -1;
                    else if (b.isLive) return 1;
                    else return alphaSort(a,b);
                };
        let sortedChannelsList = channelsList.sort(alphaSortCallback);
        return sortedChannelsList;
    })
    bridge: PortConnector;
    save = [];
	channelsConfigList = $state<UserConfigs>();
    currentConfigName = $state<string>('');
    selectedConfig = $state<I_CONFIG | undefined>(undefined);
    constructor() {
        this.startPort();
    }

    startPort() {
        let dataReceivedCallback = (msg: any) => {
            if (msg.type === CST.GET_CURRENT_CONFIGURATION) {
                this.currentConfigName = msg.data.currentConfig;
                if (msg.data) {
                    this.channelsConfigList = structuredClone(msg.data);

                    let foundConf
                    if (this.channelsConfigList?.configsList && this.currentConfigName) {
                        foundConf = this.channelsConfigList.configsList.find(conf => conf.rootList.name === this.currentConfigName);
                    }
                    this.selectedConfig = foundConf;
                }
            } else if (msg.type === CST.GET_STREAMS_REF) {
                this.channelsPickRefMap.clear();
                // let allChan = JSON.parse(JSON.stringify(CST.ALL_OTHER_CHANNELS_ELEMENT))
                // allChan.id = -1  + Math.round(Math.random()*100000);
                // this.channelsPickRefMap.set(`${CST.ALL_OTHER_CHANNELS}`, allChan)
                for (const [id, streamInfo] of msg.data) {
                    this.channelsPickRefMap.set(id, streamInfo);
                }
                // console.log("GET_STREAMS_REF", this.channelsPickRefMap.get("91232178"))
            }
        }
        this.bridge = new PortConnector(dataReceivedCallback);
    }

    getChannel(channelId: string) {
        return this.channelsPickRefMap.get(channelId);
    }

    getLiveChannel(channelId: string) {
        const channel = this.getChannel(channelId);
        return channel?.isLive ? channel : undefined;
    }

    getAllOtherChannel() {
        return this.channelsPickRef.find(e => e.id > 0);
    }




    saveConfig(toSaveChannels: I_CONFIG) {
        let copy = this.cleanRecursively('rootList', JSON.parse(JSON.stringify(toSaveChannels)));
        chrome.runtime.sendMessage(this.extensionId, { type: CST.SAVE_CHANNELS_LIST, data: copy });
    }

    cleanRecursively(listId: string, toSaveChannels: I_CONFIG) {
        // let copy = JSON.parse(JSON.stringify(toSaveChannels));
        if (toSaveChannels[listId].items.length > 0) {
            for (let currentId in toSaveChannels[listId].items) {
                if ((toSaveChannels[listId].items[currentId] as any).type === CST.TYPE_LIST) {
                    this.cleanRecursively((toSaveChannels[listId].items[currentId] as any).id, toSaveChannels);
                } else {
                    toSaveChannels[listId].items[currentId] = {channel_id: toSaveChannels[listId].items[currentId].channel_id, id: toSaveChannels[listId].items[currentId].id}
                    // delete (item as any).channel_name;
                    // delete (item as any).game_name;
                    // delete (item as any).isLive;
                    // delete (item as any).language;
                    // delete (item as any).profile_image_url;
                    // delete (item as any).title;
                    // delete (item as any).viewer_count;
                }
            }
        }
        return toSaveChannels;
    }

    resetConfig() {
        this.selectedConfig = CST.STARTUP_CONF;
    }


}

export default ConfigManager;
