import { TokenManager } from "./token";
import { logErrorChain, wrapError } from "./errors";
import type { ChannelsFollowed } from './models/rest/channels-followed';
import type { ProfilePicInfos } from './models/profilePicInfos.model';
import type { StreamsFollowed } from './models/rest/streams-followed';
import type { User } from "./models/user";
import { CLIENT_ID } from "../constantes";

export class TwitchApi {
    tokenManager;
    CLIENT_ID = CLIENT_ID;
    followedLiveStream = "https://api.twitch.tv/helix/streams/followed";
    allFollowedStream = "https://api.twitch.tv/helix/channels/followed";

    constructor(tokenManager: TokenManager) {
      this.tokenManager = tokenManager;
      this.tokenManager.initToken().catch((error) => {
        logErrorChain("TwitchApi.constructor.initToken", wrapError("TwitchApi initial token loading failed", error));
      });
    }

    /*
      {
        "id": "315220061155",
        "user_id": "85800130",
        "user_login": "etoiles",
        "user_name": "Etoiles",
        "game_id": "509658",
        "game_name": "Just Chatting",
        "type": "live",
        "title": "PETITE ANNONCE SYMPA ENSUITE QUIZ ORGA PAR NAGATOW SUR LES JEUX VIDEOS ET 21H30 COACHING TRAYTON",
        "viewer_count": 5091,
        "started_at": "2025-11-19T17:28:01Z",
        "language": "fr",
        "thumbnail_url": "https://static-cdn.jtvnw.net/previews-ttv/live_user_etoiles-{width}x{height}.jpg",
        "tag_ids": [],
        "tags": [
            "Français"
        ],
        "is_mature": false
      },
    */
    getUserFollowedLiveStream(): Promise<StreamsFollowed[]> {
        return this.tokenManager.getToken()
        .then(token => {
            return this.fetchRecursively(token, this.followedLiveStream);
        })
        .catch(error => {
            throw wrapError("TwitchApi.getUserFollowedLiveStream failed", error);
        });
    };
    
    /*
      {
        "broadcaster_id": "39476174",
        "broadcaster_login": "melilem",
        "broadcaster_name": "Melilem",
        "followed_at": "2019-10-20T14:57:15Z"
      },
    */
    getuserAllFollowedStream(): Promise<ChannelsFollowed[]> {
        return this.tokenManager.getToken()
        .then(token => {
            return this.fetchRecursively(token, this.allFollowedStream);
        })
        .catch(error => {
            throw wrapError("TwitchApi.getuserAllFollowedStream failed", error);
        });
    };

    /*
      {
        "id": "48201326",
        "login": "missmikkaa",
        "display_name": "MissMikkaa",
        "type": "",
        "broadcaster_type": "partner",
        "description": "Chill variety stream with focus on single player games. Entertainment for the chatter and the lurker. I like to do crazy challenge runs, especially in Elden Ring. Won Soulslike Streamer of the Year! Also, I have a Shiba Inu. ",
        "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/7032982d-befa-41be-a732-8cf99279f502-profile_image-300x300.png",
        "offline_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/a426fada-20f0-45f0-9f17-d909d86f145e-channel_offline_image-1920x1080.jpeg",
        "view_count": 0,
        "created_at": "2013-08-27T15:51:43Z"
      },
    */
    async getUsersProfilPic(ids: number[]): Promise<ProfilePicInfos[]> {
        try {
          const token = await this.tokenManager.getToken();
          const options = {
            method: 'GET',
            headers: {
              Authorization: 'Bearer ' + token,
              'Client-Id': this.CLIENT_ID
            }
          };

          const results: ProfilePicInfos[] = [];
          const promiseList = [];

          for (let i = 0; i < ids.length; i += 100) {
            const subIds = ids.slice(i, i + 100);
            const queryParams = new URLSearchParams();

            for (let j = 0; j < subIds.length; j++) {
              queryParams.append('id', String(subIds[j]));
            }

            const request = fetch(`https://api.twitch.tv/helix/users?${queryParams}`, options)
              .then((response) => response.json())
              .then(resp => {
                results.push(...resp.data);
              });

            promiseList.push(request);
          }

          await Promise.all(promiseList);
          return results;
        } catch (error) {
          throw wrapError("TwitchApi.getUsersProfilPic failed", error);
        }
    };

    getUserInfo(): Promise<User> {
      return new Promise((resolve, reject) => {
        this.tokenManager.getToken().then(token => {
          let options = {
            method: 'GET',
            headers: { 
              Authorization: 'Bearer ' + token,
              'Client-Id': this.CLIENT_ID
            }
          };
          fetch('https://api.twitch.tv/helix/users?', options).then((response) => {
            return response.json();
          }).then(resp => {
            resolve({
              id: resp.data[0].id,
              login: resp.data[0].login,
              display_name: resp.data[0].display_name
            })
          }).catch(err => reject(wrapError("TwitchApi.getUserInfo failed while fetching user info", err)));
        });
      });
    }
          
          
    fetchRecursively(token: string, url: string, accumulatedChannels: any[] = [], currentCursor = null): Promise<any> {
      let options = {
        method: 'GET',
        headers: { 
          Authorization: 'Bearer ' + token,
          'Client-Id': this.CLIENT_ID
        }
      };
    
      let queryParams = new URLSearchParams({
          user_id: String(217921932),
          first: String(100)
        });
    
      if (currentCursor) {
        queryParams.append("after", currentCursor);
      }
    
      return fetch(`${url}?${queryParams}`, options).then((response) => {
          return response.json();
        }).then((response) => {
          let allChannels = [...accumulatedChannels, ...response.data];
          if (response.pagination?.cursor) {
            return this.fetchRecursively(token, url, allChannels, response.pagination.cursor);
          } else {
            return allChannels;
          }
      }).catch((error) => {
          throw wrapError(`TwitchApi.fetchRecursively failed for ${url}`, error);
      });
    };
};

// export default TwitchApi;
