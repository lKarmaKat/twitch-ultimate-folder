import type * as t from 'src/service_worker/models/userStructure';

export let ALL_OTHER_CHANNELS = 'allOtherChannels';
export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
export let GET_STREAM_INFO = 'GET_STREAM_INFO';
export let GET_CURRENT_CONFIGURATION = 'GET_CURRENT_CONFIGURATION';
export let SAVE_CHANNELS_LIST = 'SAVE_CHANNELS_LIST';
export let RESET_CONFIG = 'RESET_CONFIG';
export let DISPLAY_POPUP = 'DISPLAY_POPUP';
export let HIDE_POPUP = 'HIDE_POPUP';
export let THEME = 'THEME';
export let GET_THEME = 'GET_THEME';


export let NEW_LIST: t.I_NEW_LIST = {
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
            style: {
                theme: 'SYSTEM',
                header: {
                  headerColor: "#808080",
                  borderColor: null,
                  borderWidth: null,
                  borderRadius: null
                },
                content: {
                  contentColor: "#808080",
                  contentWidth: null,
                  contentRadius: null
                }
            }
          }

export let STARTUP_CONF: t.I_CONFIG = {
          rootList: NEW_LIST
        };
// export let NAMED_CONFIG: t.NamedConfig = {
//       configName: 'default',
//       config: STARTUP_CONF
// }
export let STARTUP_USER_CONFIGS: t.UserConfigs = {
    userId: 0,
    currentConfig: 'default',
    configsList: [
      STARTUP_CONF
    ]
}

export let currentConfig = 'currentConfig';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';