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
                headerColor: "#808080",
                contentColor: "#808080"
            }
          }
        };
export let currentConfig = 'currentConfig';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';