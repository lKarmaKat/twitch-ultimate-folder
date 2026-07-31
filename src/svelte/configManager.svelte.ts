import PortConnector from './portConnector.svelte.js';
import type { StreamsInfos } from '@src/service_worker/models/streamsInfos.model';
import * as CST from '../constantes.js'
import { api } from '../browserApi'
import { readTwitchDark } from './twitchTheme.js';
import type { UserConfigs, I_CONFIG } from '../service_worker/models/userStructure.js';
import { SvelteMap } from 'svelte/reactivity';

class ConfigManager {
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

    /**
     * Ids presents dans la config mais absents des chaines suivies : la chaine a
     * ete unfollow, ou la config a ete importee avec des chaines jamais suivies.
     * Tant que le worker n'a rien pousse, la reference est vide et TOUT semblerait
     * unfollow : on ne conclut donc rien dans ce cas.
     */
    unfollowedIds = $derived.by(() => {
        if (this.channelsPickRefMap.size === 0 || !this.selectedConfig) return [];

        const ids: number[] = [];
        for (const list of Object.values(this.selectedConfig)) {
            for (const item of (list as any)?.items ?? []) {
                // Les listes n'ont pas de channel_id, les ids negatifs sont des
                // sentinelles ("toutes les autres chaines").
                if ((item as any).type === CST.TYPE_LIST) continue;
                const id = (item as any).channel_id;
                if (id === undefined || id === null || id < 0) continue;
                if (!this.getChannel(id)) ids.push(id);
            }
        }
        return ids;
    })

    /** Infos des chaines unfollow, renseignees par le worker. */
    unfollowedInfoMap = new SvelteMap<number, { channel_name: string | null, profile_image_url: string | null }>();
    /** Ids deja demandes : sans ce garde, l'effet appelant relancerait sans fin. */
    private requestedUnfollowed = new Set<number>();

    /**
     * Demande au worker le nom et l'avatar des chaines unfollow encore inconnues.
     * Un id absent de la reponse (echec reseau cote worker) n'est pas marque comme
     * demande : il sera redemande au prochain appel.
     */
    async resolveUnfollowed() {
        const toAsk = this.unfollowedIds.filter(id => !this.requestedUnfollowed.has(id));
        if (toAsk.length === 0) return;

        try {
            const answer = await api.runtime.sendMessage({ type: CST.RESOLVE_UNFOLLOWED, data: toAsk });
            if (!Array.isArray(answer)) return;
            for (const entry of answer) {
                this.requestedUnfollowed.add(Number(entry.id));
                this.unfollowedInfoMap.set(Number(entry.id), {
                    channel_name: entry.channel_name ?? null,
                    profile_image_url: entry.profile_image_url ?? null
                });
            }
        } catch (error) {
            console.error('configManager:resolveUnfollowed', error);
        }
    }

    getUnfollowedInfo(channelId: number) {
        return this.unfollowedInfoMap.get(Number(channelId));
    }

    /**
     * Retire de la config courante les chaines qui ne sont plus suivies. Rien
     * n'est enregistre : l'utilisateur valide avec le bouton de sauvegarde, ou
     * ferme la popup pour annuler. Les listes videes sont conservees, elles ont
     * ete creees a la main.
     */
    cleanUnfollowedFromConfig() {
        if (!this.selectedConfig) return;
        const toRemove = new Set(this.unfollowedIds.map(Number));
        if (toRemove.size === 0) return;

        for (const list of Object.values(this.selectedConfig)) {
            const items = (list as any)?.items;
            if (!Array.isArray(items)) continue;
            // Reassignation plutot que splice : c'est ce qui declenche $state.
            (list as any).items = items.filter((item: any) =>
                item?.type === CST.TYPE_LIST || !toRemove.has(Number(item?.channel_id)));
        }
    }


    saveConfig(toSaveChannels: I_CONFIG) {
        let copy = this.cleanRecursively('rootList', JSON.parse(JSON.stringify(toSaveChannels)));
        api.runtime.sendMessage({ type: CST.SAVE_CHANNELS_LIST, data: copy });
    }

    cleanRecursively(listId: string, toSaveChannels: I_CONFIG) {
        // let copy = JSON.parse(JSON.stringify(toSaveChannels));
        if (toSaveChannels[listId].items.length > 0) {
            for (let currentId in toSaveChannels[listId].items) {
                if ((toSaveChannels[listId].items[currentId] as any).type === CST.TYPE_LIST) {
                    this.cleanRecursively((toSaveChannels[listId].items[currentId] as any).id, toSaveChannels);
                } else {
                    const it = toSaveChannels[listId].items[currentId];
                    toSaveChannels[listId].items[currentId] = (it as any).channel_id < 0
                        ? {channel_id: (it as any).channel_id, id: (it as any).id, sort: (it as any).sort, type: (it as any).type, iconType: (it as any).iconType}
                        : {channel_id: (it as any).channel_id, id: (it as any).id}
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
        this.selectedConfig = CST.createStartupConf();
    }

    /**
     * Asks the worker to show the config iframe in the current tab, over the
     * open port — so it targets the port's tab, not the active one.
     */
    openConfigPopup() {
        this.bridge.send({ type: CST.DISPLAY_POPUP });
    }

    /**
     * Opens the help page in a tab, optionally at an anchor ('#connect'). Goes
     * through the worker: chrome.tabs does not exist in the content script.
     */
    openHelpPage(anchor: string = '') {
        // Called from the sidebar only, where Twitch's own theme is readable.
        this.bridge.send({ type: CST.OPEN_HELP_PAGE, value: anchor, dark: readTwitchDark() });
    }


}

export default ConfigManager;
