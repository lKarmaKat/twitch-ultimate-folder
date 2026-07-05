import { TwitchApi } from './twitch';
import { wrapError } from './errors';
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
                channels.forEach(channel => {
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

    getChannelProfilePicture(ids?: number[]) {
        const idsToFetch = ids ?? Array.from(this.allFollowedStreams.keys());

        return this.twitchApi.getUsersProfilPic(idsToFetch)
            .then(channels => {
                channels.forEach(channel => {
                    this.profilePicInfo.set(
                        parseInt(channel.id),
                        {
                            profile_image_url: channel.profile_image_url
                        } as ProfilePicInfos
                    );
                });

                return this.profilePicInfo;
            })
            .catch((error) => {
                throw wrapError("DataFormatter.getChannelProfilePicture failed", error);
            });
    }
}

// export default DataFormatter;
