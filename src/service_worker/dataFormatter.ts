import { TwitchApi } from './twitch';
import { wrapError, logErrorChain } from './errors';
import { channelsCache, type CachedChannel } from './channelsCache';
import type { LiveStreamInfos } from './models/liveStreamInfos.model'
import type { ProfilePicInfos } from './models/profilePicInfos.model'
import type { StreamsInfos } from './models/streamsInfos.model';
import  * as CST  from '../../src/constantes'

export class DataFormatter {
    initComplete = false;
    twitchApi: TwitchApi;
    allFollowedStreams: Map<number, StreamsInfos> = new Map();
    allLiveFollowedStreams: Map<number, LiveStreamInfos> = new Map();
    profilePicInfo: Map<number, ProfilePicInfos> = new Map();

    constructor(twitchApi: TwitchApi) {
        this.twitchApi = twitchApi;
    }

    async updateAll(): Promise<[number, StreamsInfos][]> {
        // if (this.initComplete) {
            // return Array.from(this.allFollowedStreams.values());
        // }

        try {
            await Promise.all([
                this.getAllFollowedStreams(),
                this.getAllLiveFollowedStreams()
            ]);

            if (this.profilePicInfo.size === 0) {
                await this.getChannelProfilePicture();
            } else {
                const newIds = Array.from(this.allFollowedStreams.keys())
                    .filter(id => !this.profilePicInfo.has(id) && id > 0);
                if (newIds.length > 0) {
                    await this.getChannelProfilePicture(newIds);
                }
            }
            this.mixAllInfos();
            this.initComplete = true;
            return this.getInfotoSend();
        } catch (error) {
            throw wrapError("DataFormatter.init failed", error);
        }
    }


    getInfotoSend() {
        return Array.from(this.allFollowedStreams.entries())
    }

    
    // updateAll(): Promise<StreamsInfos[]> {
    //     // this.initComplete = false
    //     return this.init().catch((error) => {
    //         throw wrapError("DataFormatter.updateAll failed", error);
    //     });
    // }

    mixAllInfos() {
        this.allFollowedStreams.forEach((value, key: number, map) => {
            value.profile_image_url = this.profilePicInfo.get(key)?.profile_image_url;
            let liveChannel = this.allLiveFollowedStreams.get(key);
            if (liveChannel) {
                value.viewer_count = liveChannel.viewer_count;
                value.language = liveChannel.language;
                value.isLive = true;
                value.game_name = liveChannel.game_name;
                value.title = liveChannel.title;
            }
            map.set(key, value);
            map.set(
                CST.ALL_OTHER_CHANNELS_ELEMENT.id,
                {
                    // id: CST.ALL_OTHER_CHANNELS_ELEMENT.id * Math.round(Math.random()*100000),
                    id: CST.ALL_OTHER_CHANNELS_ELEMENT.id,
                    channel_id: CST.ALL_OTHER_CHANNELS_ELEMENT.id,
                    channel_name: CST.ALL_OTHER_CHANNELS_ELEMENT.channel_name,
                    isLive: false,
                    profile_image_url: CST.ALL_OTHER_CHANNELS_ELEMENT.profile_image_url
                } as StreamsInfos);
        })
    }

    getAllFollowedStreams() {
        return this.twitchApi.getuserAllFollowedStream()
            .then(channels => {
                const seen = new Set<number>();
                channels.forEach(channel => {
                    seen.add(parseInt(channel.broadcaster_id));
                    this.allFollowedStreams.set(
                        parseInt(channel.broadcaster_id),
                        {
                            // id: parseInt(channel.broadcaster_id + Math.round(Math.random()*100000)),
                            id: parseInt(channel.broadcaster_id),
                            channel_id: parseInt(channel.broadcaster_id),
                            channel_name: channel.broadcaster_name,
                            isLive: false,
                        } as StreamsInfos);
                });
                // Sans ce diff, une chaine unfollow reste "suivie" jusqu'au
                // prochain redemarrage du worker. Un tableau vide veut vraiment
                // dire "plus aucun suivi" : fetchRecursively jette sur erreur.
                // Les ids negatifs sont des sentinelles (ALL_OTHER_CHANNELS).
                for (const id of this.allFollowedStreams.keys()) {
                    if (id > 0 && !seen.has(id)) this.allFollowedStreams.delete(id);
                }
                    // this.allFollowedStreams.set(
                    //     CST.ALL_OTHER_CHANNELS_ELEMENT.id,
                    //     {
                    //         id: CST.ALL_OTHER_CHANNELS_ELEMENT.id,// + Math.round(Math.random()*100000),
                    //         channel_id: CST.ALL_OTHER_CHANNELS_ELEMENT.id,
                    //         channel_name: CST.ALL_OTHER_CHANNELS_ELEMENT.channel_name,
                    //         isLive: false,
                    //         profile_image_url: CST.ALL_OTHER_CHANNELS_ELEMENT.profile_image_url
                    //     } as StreamsInfos);
                return this.allFollowedStreams;
            })
            .catch((error) => {
                throw wrapError("DataFormatter.getAllFollowedStreams failed", error);
            });
    }

    getAllLiveFollowedStreams() {
        return this.twitchApi.getUserFollowedLiveStream()
            .then(channels => {
                this.allLiveFollowedStreams.clear();
                channels.forEach(channel => {
                    this.allLiveFollowedStreams.set(
                        parseInt(channel.user_id),
                        {
                            id: parseInt(channel.user_id),
                            viewer_count: channel.viewer_count,
                            language: channel.language,
                            game_name: channel.game_name,
                            title: channel.title
                        } as LiveStreamInfos);
                });

                return this.allLiveFollowedStreams;
            })
            .catch((error) => {
                throw wrapError("DataFormatter.getAllLiveFollowedStreams failed", error);
            });
    }

    /**
     * Nom et avatar de chaines absentes des suivis : entrees de config restees
     * apres un unfollow, ou config importee. Le cache repond seul dans le cas
     * courant ; /users n'est appele que pour les ids jamais vus.
     *
     * Un id introuvable (compte supprime ou banni) revient avec channel_name
     * null : l'appelant sait alors qu'il est resolu, et cesse de le demander.
     */
    async resolveChannels(ids: number[]): Promise<{ id: number, channel_name: string | null, profile_image_url: string | null }[]> {
        const wanted = Array.from(new Set(ids.map(Number).filter(id => Number.isFinite(id) && id > 0)));
        if (wanted.length === 0) return [];

        const cached = await channelsCache.get(wanted);
        const missing = wanted.filter(id => !cached.has(id));
        let lookupDone = true;

        if (missing.length > 0) {
            try {
                const channels = await this.twitchApi.getUsersProfilPic(missing);
                const toCache = new Map<number, CachedChannel>();
                channels.forEach(channel => {
                    const entry: CachedChannel = {
                        channel_name: channel.display_name ?? channel.login ?? '',
                        login: channel.login ?? '',
                        profile_image_url: channel.profile_image_url
                    };
                    cached.set(parseInt(channel.id), entry);
                    toCache.set(parseInt(channel.id), entry);
                });
                await channelsCache.put(toCache);
            } catch (error) {
                // Reseau ou token indisponible : on ne repond que les entrees du
                // cache. Les autres sont omises plutot que renvoyees nulles, sinon
                // l'appelant les croirait resolues et ne redemanderait jamais.
                lookupDone = false;
                logErrorChain("DataFormatter.resolveChannels", error);
            }
        }

        return wanted
            .filter(id => lookupDone || cached.has(id))
            .map(id => {
                const entry = cached.get(id);
                return {
                    id,
                    channel_name: entry?.channel_name || null,
                    profile_image_url: entry?.profile_image_url || null
                };
            });
    }

    getChannelProfilePicture(ids?: number[]) {
        const idsToFetch = ids ?? Array.from(this.allFollowedStreams.keys());

        return this.twitchApi.getUsersProfilPic(idsToFetch)
            .then(channels => {
                const toCache = new Map<number, CachedChannel>();
                channels.forEach(channel => {
                    this.profilePicInfo.set(
                        parseInt(channel.id),
                        {
                            profile_image_url: channel.profile_image_url,
                            login: channel.login,
                            display_name: channel.display_name
                        } as ProfilePicInfos
                    );
                    toCache.set(parseInt(channel.id), {
                        channel_name: channel.display_name ?? channel.login ?? '',
                        login: channel.login ?? '',
                        profile_image_url: channel.profile_image_url
                    });
                });
                // Cet appel /users a lieu une fois par chaine suivie : c'est la
                // source gratuite du cache, qui servira apres un unfollow.
                void channelsCache.put(toCache)
                    .catch(error => logErrorChain("DataFormatter.channelsCache.put", error));

                return this.profilePicInfo;
            })
            .catch((error) => {
                throw wrapError("DataFormatter.getChannelProfilePicture failed", error);
            });
    }
}

// export default DataFormatter;
