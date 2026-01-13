import { TwitchApi } from './twitch';
import type { LiveStreamInfos } from './models/liveStreamInfos.model'
import type { ProfilePicInfos } from './models/profilePicInfos.model'
import type { StreamsInfos } from './models/streamsInfos.model';


export class DataFormatter {
    initComplete = false;
    twitchApi: TwitchApi;
    allFollowedStreams: Map<number, StreamsInfos> = new Map();
    allLiveFollowedStreams: Map<number, LiveStreamInfos> = new Map();
    profilePicInfo: Map<number, ProfilePicInfos> = new Map();

    constructor(twitchApi: TwitchApi) {
        this.twitchApi = twitchApi;
    }

    init(): Promise<StreamsInfos[]> {
        if (!this.initComplete) {
            return new Promise(resolve => {
                Promise.allSettled([
                    this.getAllFollowedStreams(),
                    this.getAllLiveFollowedStreams()]
                ).then(() => {
                    return this.getChannelProfilePicture();
                })
                .then(() => {
                    this.mixAllInfos();
                    this.initComplete = true;
                    resolve(Array.from(this.allFollowedStreams.values()));
                });
            });
        } else {
            return new Promise(resolve => {
                resolve(Array.from(this.allFollowedStreams.values()));
            })
        }
    }

    
    updateAll(): Promise<StreamsInfos[]> {
        this.initComplete = false
        return new Promise(resolve => {
            resolve(this.init());
        });
    }

    mixAllInfos() {
        this.allFollowedStreams.forEach((value, key, map) => {
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
        })
    }

    getAllFollowedStreams() {
        return new Promise(resolve => {        
            this.twitchApi.getuserAllFollowedStream().then(channels => {
                channels.forEach(channel => {
                    this.allFollowedStreams.set(
                        channel.broadcaster_id, 
                        {
                            id: channel.broadcaster_id + Math.round(Math.random()*100000),
                            channel_id: channel.broadcaster_id,
                            channel_name: channel.broadcaster_name,
                            isLive: false
                        } as StreamsInfos);
                })
                resolve(this.allFollowedStreams);
            });
        });
    }

    getAllLiveFollowedStreams() {
        return new Promise(resolve => {
            this.twitchApi.getUserFollowedLiveStream().then(channels => {
                channels.forEach(channel => {
                    this.allLiveFollowedStreams.set(
                        channel.user_id,
                        {
                            id: channel.user_id,
                            viewer_count: channel.viewer_count,
                            language: channel.language,
                            game_name: channel.game_name,
                            title: channel.title
                        } as LiveStreamInfos);
                });
                resolve(this.allLiveFollowedStreams);
            });
        });
    }

    getChannelProfilePicture() {
        return new Promise(resolve => {
            let ids = Array.from(this.allFollowedStreams.keys());
            this.twitchApi.getUsersProfilPic(ids).then(channels => {
                channels.forEach(channel => {
                    this.profilePicInfo.set(
                        channel.id,
                        {
                            profile_image_url: channel.profile_image_url
                        } as ProfilePicInfos
                    )
                });
                resolve(this.profilePicInfo);
            });
        });
    }
}

// export default DataFormatter;