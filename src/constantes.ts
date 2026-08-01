import type * as t from 'src/service_worker/models/userStructure';

// export const CLIENT_ID = '0cccietj726skd2jwlf39ymhmyzbi7';
export const CLIENT_ID = '1baau10iaxptnjjl9o9yt6kb8ibrv9';
export const POLLING_INTERVAL = 6000;
export const ALL_OTHER_CHANNELS = -1;
export const GET_STREAMS_REF = 'GET_STREAMS_REF';
export const GET_CURRENT_CONFIGURATION = 'GET_CURRENT_CONFIGURATION';
export const SAVE_CHANNELS_LIST = 'SAVE_CHANNELS_LIST';
export const RESET_CONFIG = 'RESET_CONFIG';
/** Config page asks the worker for the infos of channels it no longer follows. */
export const RESOLVE_UNFOLLOWED = 'RESOLVE_UNFOLLOWED';
export const DISPLAY_POPUP = 'DISPLAY_POPUP';
export const OPEN_HELP_PAGE = 'OPEN_HELP_PAGE';
/** Handshake posted by the service worker on every port connection. */
export const PORT_READY = 'PORT_READY';
export const HIDE_POPUP = 'HIDE_POPUP';
export const ALIGNMENT = 'ALIGNMENT';
export const CHANGE_ALIGNMENT = 'CHANGE_ALIGNMENT';
export const GET_ALIGNMENT = 'GET_ALIGNMENT';
export const TITLE_SIDE = 'TITLE_SIDE';
export const CHANGE_TITLE_SIDE = 'CHANGE_TITLE_SIDE';
export const GET_TITLE_SIDE = 'GET_TITLE_SIDE';
export const LOCALE = 'LOCALE';
export const CHANGE_LOCALE = 'CHANGE_LOCALE';
export const GET_LOCALE = 'GET_LOCALE';
export const IS_USER_LOGGED_IN = 'IS_USER_LOGGED_IN';
export const AUTH_DEVICE_CODE = 'AUTH_DEVICE_CODE';
/** Content script reports the userId read from the Twitch session cookie (null = logged out). */
export const SESSION_USER_CHANGED = 'SESSION_USER_CHANGED';
/** Service worker asks a tab about its current session (action popup path). */
export const GET_SESSION_USER = 'GET_SESSION_USER';
/** Only entry point of the device flow: never triggered automatically. */
export const START_AUTH = 'START_AUTH';
/** Authentication state broadcast on the `auth` port. */
export const AUTH_STATE = 'AUTH_STATE';

// Auth states: three for the sidebar, four for the action popup, which can be
// opened from a non-Twitch tab where the session is unknowable.
export const AUTH_NOT_ON_TWITCH = 'NOT_ON_TWITCH';
export const AUTH_NO_SESSION = 'NO_SESSION';
export const AUTH_NEED_AUTH = 'NEED_AUTH';
export const AUTH_READY = 'READY';

// chrome.storage.local keys, one per user. Tokens and configs stay separate:
// saveConfig read-modify-writes while token refresh writes on a timer.
export const tokenKey = (userId: string | number) => `token_${userId}`;
export const configKey = (userId: string | number) => `config_${userId}`;
// Channel infos (name, avatar) kept across worker restarts: a config holds only
// ids, and an unfollowed channel is no longer in any Twitch answer. Not per
// user, a channel's name does not depend on who follows it.
export const CHANNELS_CACHE_KEY = 'channels_cache';
export const CHANNELS_CACHE_MAX = 2000;

export const SYSTEM_STYLE = 'SYSTEM_STYLE';
export const CUSTOM_STYLE = 'CUSTOM_STYLE';
export let TYPE_LIST = 'list'
/** Item carrying only a label: no channel, no body, no open state. */
export const TYPE_SEPARATOR = 'separator'


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
/** chrome.storage.local key, 1/0: 1 = channel title shown on the left. */
export const PARAM_TITLE_SIDE_LEFT = 'titleSideLeft';

// Medium is 0: every config saved before the option existed already holds
// `height: 0`, so they stay on the current dimensions without a migration.
export const HEADER_HEIGHT_MEDIUM = 0;
export const HEADER_HEIGHT_SMALL = 1;
export const HEADER_HEIGHT_TYPE = [
  { id: HEADER_HEIGHT_MEDIUM, name: 'headerHeight.medium' },
  { id: HEADER_HEIGHT_SMALL, name: 'headerHeight.small' }
]


// The `label`/`tooltip`/`name` below are i18n keys resolved with $_() in the
// components ($_ cannot be used from a .ts file).
export const BEHAVIOUR = [
{id: EXTENDED_ON_STARTUP, label: 'behaviour.extendedOnStartup.label', tooltip: 'behaviour.extendedOnStartup.tooltip'},
{id: EXTENDEDS_ON_HOVER, label: 'behaviour.extendsOnHover.label', tooltip: 'behaviour.extendsOnHover.tooltip'},
{id: EXTENDEDS_ON_CLICK, label: 'behaviour.extendsOnClick.label', tooltip: 'behaviour.extendsOnClick.tooltip'},
{id: SHOW_EVEN_IF_NO_LIVE, label: 'behaviour.showEvenIfOffline.label', tooltip: 'behaviour.showEvenIfOffline.tooltip'},
];

export const STYLE_PILL_HEADER = 'pillHeader';
export const STYLE_INDENT_RAIL = 'indentRail';

// `group` is the `style` sub-object the flag is stored in.
export const STYLE_OPTIONS = [
{key: STYLE_PILL_HEADER, group: 'header', label: 'styleOptions.pillHeader.label', tooltip: 'styleOptions.pillHeader.tooltip'},
{key: STYLE_INDENT_RAIL, group: 'content', label: 'styleOptions.indentRail.label', tooltip: 'styleOptions.indentRail.tooltip'},
];

export const TYPE_CHEVRON = 'chevron';
export const TYPE_EXCLUSIVE = 'exclusive';

// Booleans stored in the list `type` object, all false by default so a config
// saved before they existed keeps rendering exactly as it did. `group` is the
// panel section the checkbox belongs to.
export const TYPE_OPTIONS = [
{key: TYPE_CHEVRON, group: 'style', label: 'typeOptions.chevron.label', tooltip: 'typeOptions.chevron.tooltip'},
{key: TYPE_EXCLUSIVE, group: 'behavior', label: 'typeOptions.exclusive.label', tooltip: 'typeOptions.exclusive.tooltip'},
];

export const SORT_STRATEGY = [
  {id: CUSTOM_SORT, type: 'CUSTOM_SORT', name: 'sort.custom'},
  {id: VIEWER_SORT, type: 'VIEWER_SORT', name: 'sort.viewer'},
  {id: ALPHA_SORT, type: 'ALPHA_SORT', name: 'sort.alpha'},
]

/* Every colour holds at least 3.2:1 against both Twitch backgrounds
   (#18181b and #f7f7f8) so a 3px bar stays visible on either theme. */
export const BAR_TYPE = [
  {
    id: 1,
    name: 'bar.purple',
    color: "#9147FF"
  },{
    id: 2,
    name: 'bar.green',
    color: "#009E42"
  },{
    id: 3,
    name: 'bar.orange',
    color: "#F05800"
  },{
    id: 4,
    name: 'bar.red',
    color: "#FF3F38"
  },{
    id: 5,
    name: 'bar.amber',
    color: "#C27B00"
  },{
    id: 6,
    name: 'bar.teal',
    color: "#009980"
  },{
    id: 7,
    name: 'bar.cyan',
    color: "#0093B8"
  },{
    id: 8,
    name: 'bar.blue',
    color: "#058AFF"
  },{
    id: 9,
    name: 'bar.indigo',
    color: "#6B7FFF"
  },{
    id: 10,
    name: 'bar.lavender',
    color: "#A666FF"
  },{
    id: 11,
    name: 'bar.magenta',
    color: "#E32EFF"
  },{
    id: 12,
    name: 'bar.pink',
    color: "#FF3388"
  },{
    id: 13,
    name: 'bar.graphite',
    color: "#7E7E92"
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


// Built fresh on every use: assigning them directly would share the template
// reference, so any caller mutation would corrupt every list created later.
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
        borderRadius: null,
        [STYLE_PILL_HEADER]: false
      },
      content: {
        contentColor: "#808080",
        contentWidth: null,
        contentRadius: null,
        borderColor: "#808080",
        borderWidth: null,
        borderRadius: null,
        [STYLE_INDENT_RAIL]: false
      }
    },
    type: {
      height: 0,
      iconType: 0, // ICON_NONE (see svelte/components/icons/index.ts): no icon, no reserved space
      barType: 0,
      viewerCountType: 2,
      [TYPE_CHEVRON]: false,
      [TYPE_EXCLUSIVE]: false
    }
  };
}

export function createStartupConf(): t.I_CONFIG {
  return { rootList: createNewList() };
}

// Recursive freeze: ES modules are strict mode, so a forgotten mutation throws
// a TypeError instead of silently corrupting the template.
function deepFreeze<T>(o: T): T {
  Object.values(o as any).forEach(v => {
    if (v && typeof v === 'object') deepFreeze(v);
  });
  return Object.freeze(o);
}

/** Read-only. Use createNewList() for a mutable object. */
export const NEW_LIST: t.I_NEW_LIST = deepFreeze(createNewList());

/** Read-only. Use createStartupConf() for a mutable object. */
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

/** Read-only. Use createStartupUserConfigs() for a mutable object. */
export const STARTUP_USER_CONFIGS: t.UserConfigs = deepFreeze(createStartupUserConfigs());

export const currentConfig = 'currentConfig';

export const ALL_OTHER_CHANNELS_ELEMENT = {
        "id": ALL_OTHER_CHANNELS,
        "channel_id": ALL_OTHER_CHANNELS,
        "channel_name": "All others channels",
        "sort": ALPHA_SORT,
        "type": ALL_OTHER_HEADER_NONE,
        "height": HEADER_HEIGHT_MEDIUM,
        "iconType": 0,
        "isLive": false,
        "profile_image_url": "../../assets/all_other_channels.png",
        "viewer_count": 0, 
        "language": "", 
        "game_name": "",
        "title": ""
    }

/** Avatar shown for a config entry whose channel is no longer followed. */
export const UNFOLLOWED_CHANNEL_IMAGE = "../../assets/unfollowed.png";
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';
// export let UPDATE_STREAM_INFO = 'UPDATE_STREAM_INFO';