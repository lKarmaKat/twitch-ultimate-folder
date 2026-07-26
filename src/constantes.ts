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
export const OPEN_HELP_PAGE = 'OPEN_HELP_PAGE';
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
export const SHOW_EVEN_IF_NO_LIVE = 3;

export const CUSTOM_SORT = 0;
export const VIEWER_SORT = 1;
export const ALPHA_SORT = 2;

export const ALL_OTHER_HEADER_NONE = 0;
export const ALL_OTHER_HEADER_SORTABLE = 1;
export const ALL_OTHER_HEADER_TYPE = [
  { id: ALL_OTHER_HEADER_NONE, name: 'allOtherHeader.none' },
  { id: ALL_OTHER_HEADER_SORTABLE, name: 'allOtherHeader.sortable' },
];

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
{id: EXTENDEDS_ON_CLICK, label: 'behaviour.extendsOnClick.label', tooltip: 'behaviour.extendsOnClick.tooltip'},
{id: SHOW_EVEN_IF_NO_LIVE, label: 'behaviour.showEvenIfOffline.label', tooltip: 'behaviour.showEvenIfOffline.tooltip'},
];

export const SORT_STRATEGY = [
  {id: CUSTOM_SORT, type: 'CUSTOM_SORT', name: 'sort.custom'},
  {id: VIEWER_SORT, type: 'VIEWER_SORT', name: 'sort.viewer'},
  {id: ALPHA_SORT, type: 'ALPHA_SORT', name: 'sort.alpha'},
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
  }, {
    id: 4,
    name: 'counterType.withTotalCount'
  }, {
    id: 5,
    name: 'counterType.withLiveIcon'
  }
]


// Les objets ci-dessous doivent être créés frais à chaque usage : les affecter
// directement partagerait la référence du template, et toute mutation de
// l'appelant (renommage, ajout d'items, cases de comportement) corromprait
// silencieusement le défaut de toutes les listes créées ensuite.
export function createNewList(): t.I_NEW_LIST {
  return {
    id: 'node1',
    name: 'default',
    items: [],
    behavior: {
      [EXTENDED_ON_STARTUP]: true,
      [EXTENDEDS_ON_HOVER]: true,
      [EXTENDEDS_ON_CLICK]: true,
      [SHOW_EVEN_IF_NO_LIVE]: false
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
  };
}

export function createStartupConf(): t.I_CONFIG {
  return { rootList: createNewList() };
}

// Gèle récursivement : les modules ES étant en mode strict, un site de mutation
// oublié lève une TypeError au lieu de corrompre le template en silence.
function deepFreeze<T>(o: T): T {
  Object.values(o as any).forEach(v => {
    if (v && typeof v === 'object') deepFreeze(v);
  });
  return Object.freeze(o);
}

/** Lecture seule. Pour un objet modifiable, utiliser createNewList(). */
export const NEW_LIST: t.I_NEW_LIST = deepFreeze(createNewList());

/** Lecture seule. Pour un objet modifiable, utiliser createStartupConf(). */
export const STARTUP_CONF: t.I_CONFIG = deepFreeze(createStartupConf());
// export let NAMED_CONFIG: t.NamedConfig = {
//       configName: 'default',
//       config: STARTUP_CONF
// }
export function createStartupUserConfigs(userId = 0): t.UserConfigs {
  return {
    userId,
    currentConfig: 'default',
    configsList: [
      createStartupConf()
    ]
  };
}

/** Lecture seule. Pour un objet modifiable, utiliser createStartupUserConfigs(). */
export const STARTUP_USER_CONFIGS: t.UserConfigs = deepFreeze(createStartupUserConfigs());

export const currentConfig = 'currentConfig';

export const ALL_OTHER_CHANNELS_ELEMENT = {
        "id": ALL_OTHER_CHANNELS,
        "channel_id": ALL_OTHER_CHANNELS,
        "channel_name": "All others channels",
        "sort": ALPHA_SORT,
        "type": ALL_OTHER_HEADER_NONE,
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