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
export const LOCALE = 'LOCALE';
export const CHANGE_LOCALE = 'CHANGE_LOCALE';
export const GET_LOCALE = 'GET_LOCALE';
export const IS_USER_LOGGED_IN = 'IS_USER_LOGGED_IN';
export const AUTH_DEVICE_CODE = 'AUTH_DEVICE_CODE';
export const SYSTEM_STYLE = 'SYSTEM_STYLE';
export const CUSTOM_STYLE = 'CUSTOM_STYLE';
export let TYPE_LIST = 'list'


export const EXTENDED_ON_STARTUP = 0;
export const EXTENDEDS_ON_HOVER = 1;
export const EXTENDEDS_ON_CLICK = 2;

export const CUSTOM_SORT = 0;
export const VIEWER_SORT = 1;
export const ALPHA_SORT = 2;

export const PARAM_ALIGNMENT_LEFT = 'alignmentLeft';

export const HEADER_TYPE_HEIGHT = [ // Not currently used
  { id: 1, name: 'small' },
  { id: 2, name: 'medium' },
  { id: 3, name: 'large' }
]
  

// Les `label`/`tooltip`/`name` ci-dessous sont des clés i18n résolues avec $_()
// dans les composants (on ne peut pas utiliser $_ dans un .ts).
export const BEHAVIOUR = [
{id: EXTENDED_ON_STARTUP, label: 'behaviour.extendedOnStartup.label', tooltip: 'behaviour.extendedOnStartup.tooltip'},
{id: EXTENDEDS_ON_HOVER, label: 'behaviour.extendsOnHover.label', tooltip: 'behaviour.extendsOnHover.tooltip'},
{id: EXTENDEDS_ON_CLICK, label: 'behaviour.extendsOnClick.label', tooltip: 'behaviour.extendsOnClick.tooltip'}
];

export const SORT_STRATEGY = [
  {id: CUSTOM_SORT, type: 'CUSTOM_SORT', name: 'sort.custom'},
  {id: VIEWER_SORT, type: 'VIEWER_SORT', name: 'sort.viewer'},
  {id: ALPHA_SORT, type: 'ALPHA_SORT', name: 'sort.alpha'},
]

export const ICON_TYPE = [
  {
    id: 1,
    name: 'icon.folder'
  },
  {
    id: 2,
    name: 'icon.dot'
  },
  {
    id: 3,
    name: 'icon.angle'
  }, {
    id: 4,
    name: 'icon.cross'
  }, {
    id: 5,
    name: 'icon.valorant'
  }, {
    id: 6,
    name: 'icon.lol'
  }, {
    id: 7,
    name: 'icon.rocketLeague1'
  }, {
    id: 8,
    name: 'icon.rocketLeague2'
  }, {
    id: 9,
    name: 'icon.cod1'
  }, {
    id: 10,
    name: 'icon.cod2'
  }, {
    id: 11,
    name: 'icon.cod3'
  }, {
    id: 12,
    name: 'icon.cod4'
  }, {
    id: 13,
    name: 'icon.counterStrike'
  }, {
    id: 14,
    name: 'icon.minecraft'
  }, {
    id: 15,
    name: 'icon.minecraft2'
  }, {
    id: 16,
    name: 'icon.coffee'
  }, {
    id: 17,
    name: 'icon.dota'
  }, {
    id: 18,
    name: 'icon.fortnite'
  }, {
    id: 19,
    name: 'icon.fortnite2'
  }, {
    id: 20,
    name: 'icon.overwatch'
  }, {
    id: 21,
    name: 'icon.arcRaiders'
  }, {
    id: 22,
    name: 'icon.rainbow6'
  }, {
    id: 23,
    name: 'icon.gta5'
  }, {
    id: 24,
    name: 'icon.gta6'
  }, {
    id: 25,
    name: 'icon.music1'
  }, {
    id: 26,
    name: 'icon.music2'
  }
]

export const BAR_TYPE = [
  {
    id: 1,
    name: 'bar.purple',
    color: "rgb(145, 71, 255)"
  },{
    id: 2,
    name: 'bar.green',
    color: "rgb(0, 200, 0)"
  },{
    id: 3,
    name: 'bar.orange',
    color: "rgb(100, 50, 20)"
  }
]


export const COUNTER_TYPE = [
  {
    id: 1,
    name: 'counterType.bareCounter'
  }, {
    id: 2,
    name: 'counterType.badge'
  }, {
    id: 3,
    name: 'counterType.nakedBadge'
  }
]


export const NEW_LIST: t.I_NEW_LIST = {
            id:'node1',
            name:'default',
            items:[
            ],
            behavior: {
                [EXTENDED_ON_STARTUP]: true,
                [EXTENDEDS_ON_HOVER]: false,
                [EXTENDEDS_ON_CLICK]: false
            },
            sort: SORT_STRATEGY[CUSTOM_SORT].id,
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
        "channel_id": ALL_OTHER_CHANNELS,
        "channel_name": "All others channels",
        "sort": ALPHA_SORT,
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