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

export let STARTUP_CONF = {
          rootList:{
            id:'node1',
            name:'liste principale',
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
                  backgroundColor: "#808080",
                  borderColor: "#808080",
                  borderWidth: "1px",
                  borderRadius: 0
                },
                content: {
                  backgroundColor: "#808080",
                  borderColor: "#808080",
                  borderWidth: "1px",
                  borderRadius: 0
                }
            }
          }
        };
export let NEW_LIST = {
            id:'node1',
            name:'liste principale',
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

export interface CONFIG { [key: string]: string; }
export let currentConfig = 'currentConfig';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';