import type * as t from 'src/service_worker/models/userStructure';

export const POLLING_INTERVAL = 6000;
export const ALL_OTHER_CHANNELS = -1;
export const UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
export const GET_STREAM_INFO = 'GET_STREAM_INFO';
export const GET_CURRENT_CONFIGURATION = 'GET_CURRENT_CONFIGURATION';
export const SAVE_CHANNELS_LIST = 'SAVE_CHANNELS_LIST';
export const RESET_CONFIG = 'RESET_CONFIG';
export const DISPLAY_POPUP = 'DISPLAY_POPUP';
export const HIDE_POPUP = 'HIDE_POPUP';
export const THEME = 'THEME';
export const CHANGE_THEME = 'CHANGE_THEME';
export const GET_THEME = 'GET_THEME';
export const ALIGNMENT = 'ALIGNMENT';
export const CHANGE_ALIGNMENT = 'CHANGE_ALIGNMENT';
export const GET_ALIGNMENT = 'GET_ALIGNMENT';
export const ALPHA_SORT = 'ALPHA';
export const VIEWER_SORT = 'VIEWER';
export const CUSTOM_SORT = 'CUSTOM';
export let TYPE_LIST = 'list'

export const PARAM_ALIGNMENT_LEFT = 'alignmentLeft';


export const NEW_LIST: t.I_NEW_LIST = {
            id:'node1',
            name:'default',
            items:[
            ],
            behavior: {
                extendedOnStartup: true,
                extendOnHover: false,
                extendOnClick: false,
                isPinnable: true
            },
            sort: CUSTOM_SORT,
            style: {
                theme: 'SYSTEM',
                header: {
                  headerColor: "#808080",
                  borderColor: "#808080",
                  borderWidth: null,
                  borderRadius: null
                },
                content: {
                  contentColor: "#808080",
                  contentWidth: null,
                  contentRadius: null,
                  borderColor: "#808080",
                  borderWidth: null,
                  borderRadius: null
                }
            }
          }

export const STARTUP_CONF: t.I_CONFIG = {
          rootList: NEW_LIST
        };
// export let NAMED_CONFIG: t.NamedConfig = {
//       configName: 'default',
//       config: STARTUP_CONF
// }
export const STARTUP_USER_CONFIGS: t.UserConfigs = {
    userId: 0,
    currentConfig: 'default',
    configsList: [
      STARTUP_CONF
    ]
}

export const currentConfig = 'currentConfig';

export const ALL_OTHER_CHANNELS_ELEMENT = {
        "id": ALL_OTHER_CHANNELS,
        "channel_id": -1,
        "channel_name": "All others channels",
        "sort": 'ALPHA',
        "isLive": false,
        "profile_image_url": "../../assets/profil.png"
    }
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';