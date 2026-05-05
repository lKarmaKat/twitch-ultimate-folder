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
    name: 'folder',
    path: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1H8L7 2z"></path>
            </svg>` 
  },
  {
    id: 2, 
    name: 'dot',
    path: `<svg xmlns="http://www.w3.org/2000/svg" fill="#000000" width="16px" height="16px" viewBox="0 0 20 20"><path d="M7.8 10a2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0-4.4 0z"/></svg>` 
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
              height: HEADER_TYPE_HEIGHT[1].id,
              iconType: ICON_TYPE[0].id,
              barType: BAR_TYPE[0].id,
              viewerCountType: 1
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