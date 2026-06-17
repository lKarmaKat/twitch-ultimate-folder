import type * as t from 'src/service_worker/models/userStructure';

// export const CLIENT_ID = '0cccietj726skd2jwlf39ymhmyzbi7';
export const CLIENT_ID = '1baau10iaxptnjjl9o9yt6kb8ibrv9';
export const POLLING_INTERVAL = 6000;
export const ALL_OTHER_CHANNELS = -1;
export const GET_STREAMS_REF = 'GET_STREAMS_REF';
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
export const IS_USER_LOGGED_IN = 'IS_USER_LOGGED_IN';
export const AUTH_DEVICE_CODE = 'AUTH_DEVICE_CODE';
export const ALPHA_SORT = 'ALPHA';
export const VIEWER_SORT = 'VIEWER';
export const CUSTOM_SORT = 'CUSTOM';
export const SYSTEM_STYLE = 'SYSTEM_STYLE';
export const CUSTOM_STYLE = 'CUSTOM_STYLE';
export let TYPE_LIST = 'list'

export const PARAM_ALIGNMENT_LEFT = 'alignmentLeft';

export const HEADER_TYPE_HEIGHT = [
  { id: 1, name: 'small' },
  { id: 2, name: 'medium' },
  { id: 3, name: 'large' }
]
  


export const ICON_TYPE = [
  { 
    id: 1, 
    name: 'folder'
  },
  {
    id: 2, 
    name: 'dot'
  },
  {
    id: 3,
    name: 'angle'
  }, {
    id: 4,
    name: 'cross'
  }, {
    id: 5,
    name: 'Valorant'
  }, {
    id: 6,
    name: 'League of Legends'
  }, {
    id: 7,
    name: 'Rocket League 1'
  }, {
    id: 8,
    name: 'Rocket League 2'
  }, {
    id: 9,
    name: 'CoD 1'
  }, {
    id: 10,
    name: 'CoD 2'
  }, {
    id: 11,
    name: 'CoD 3'
  }, {
    id: 12,
    name: 'CoD 4'
  }, {
    id: 13,
    name: 'Counter Strike'
  }, {
    id: 14,
    name: 'Minecraft'
  }, {
    id: 15,
    name: 'Minecraft 2'
  }, {
    id: 16,
    name: 'Coffee'
  }, {
    id: 17,
    name: 'Dota'
  }, {
    id: 18,
    name: 'Fortnite'
  }, {
    id: 19,
    name: 'Fortnite 2'
  }, {
    id: 20,
    name: 'Overwatch'
  }, {
    id: 21,
    name: 'Arc Raiders'
  }, {
    id: 22,
    name: 'Rainbow 6'
  }, {
    id: 23,
    name: 'GTA 5'
  }, {
    id: 24,
    name: 'GTA 6'
  }, {
    id: 25,
    name: 'Musique 1'
  }, {
    id: 26,
    name: 'Musique 2'
  }
]

export const BAR_TYPE = [
  {
    id: 1,
    name: 'purple',
    color: "rgb(145, 71, 255)"
  },{
    id: 2,
    name: 'green',
    color: "rgb(0, 200, 0)"
  },{
    id: 3,
    name: 'orange',
    color: "rgb(100, 50, 20)"
  }
]


export const COUNTER_TYPE = [
  {
    id: 1,
    name: 'bare counter'
  }, {
    id: 2,
    name: 'badge'
  }, {
    id: 3,
    name: 'naked badge'
  }
]


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
                theme: SYSTEM_STYLE,
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
            },
            type: {
              height: 0,
              iconType: 0,
              barType: 0,
              viewerCountType: 2
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
        "profile_image_url": "../../assets/all_other_channels.png",
        "viewer_count": 0, 
        "language": "", 
        "game_name": "", 
        "title": ""
    }
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';