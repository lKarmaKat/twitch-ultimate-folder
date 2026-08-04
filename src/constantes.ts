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
export const SKIN = 'SKIN';
export const CHANGE_SKIN = 'CHANGE_SKIN';
export const GET_SKIN = 'GET_SKIN';
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
/** Config page asks the worker to proxy a Helix category search (needs the shared token). */
export const SEARCH_CATEGORIES = 'SEARCH_CATEGORIES';

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
/** chrome.storage.local key, 1/0: 1 = channel rows highlight on hover. Default off keeps today's look. */
export const PARAM_SKIN_MODERN = 'skinModern';

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
export const STYLE_HAS_BAR = 'hasBar';

// `group` is the `style` sub-object the flag is stored in.
export const STYLE_OPTIONS = [
{key: STYLE_PILL_HEADER, group: 'header', label: 'styleOptions.pillHeader.label', tooltip: 'styleOptions.pillHeader.tooltip'},
{key: STYLE_INDENT_RAIL, group: 'content', label: 'styleOptions.indentRail.label', tooltip: 'styleOptions.indentRail.tooltip'},
{key: STYLE_HAS_BAR, group: 'header', label: 'styleOptions.hasBar.label', tooltip: 'styleOptions.hasBar.tooltip'},
];

export const TYPE_CHEVRON = 'chevron';
export const TYPE_EXCLUSIVE = 'exclusive';
export const TYPE_HEADLESS = 'headless';

// All false by default: a config saved before they existed keeps rendering as
// it did. `group` is the panel section the checkbox belongs to.
export const TYPE_OPTIONS = [
{key: TYPE_CHEVRON, group: 'style', label: 'typeOptions.chevron.label', tooltip: 'typeOptions.chevron.tooltip'},
{key: TYPE_EXCLUSIVE, group: 'behavior', label: 'typeOptions.exclusive.label', tooltip: 'typeOptions.exclusive.tooltip'},
// Only ever shown in ConfigPannel for LIST_LAYOUT_DOCK and LIST_LAYOUT_STACK:
// false by default so an existing list saved before this option existed
// keeps showing its header.
{key: TYPE_HEADLESS, group: 'style', label: 'typeOptions.headless.label', tooltip: 'typeOptions.headless.tooltip'},
];

// 0 is today's row-per-channel rendering: a config saved before layouts
// existed keeps rendering exactly as it did.
export const LIST_LAYOUT_STACK = 0;
export const LIST_LAYOUT_SPLIT = 1;
export const LIST_LAYOUT_FLYOUT = 2;
export const LIST_LAYOUT_TABS = 3;
export const LIST_LAYOUT_GRID = 4;
export const LIST_LAYOUT_DOCK = 5;
export const LIST_LAYOUT_OPTIONS = [
  {id: LIST_LAYOUT_STACK, name: 'listLayout.stack'},
  {id: LIST_LAYOUT_SPLIT, name: 'listLayout.split'},
  {id: LIST_LAYOUT_FLYOUT, name: 'listLayout.flyout'},
  {id: LIST_LAYOUT_TABS, name: 'listLayout.tabs'},
  {id: LIST_LAYOUT_GRID, name: 'listLayout.grid'},
  {id: LIST_LAYOUT_DOCK, name: 'listLayout.dock'},
];
// Layouts whose body isn't a vertical rail, so the indentRail checkbox has
// nothing to attach to and is hidden in ConfigPannel.
export const LIST_LAYOUTS_WITHOUT_RAIL = [LIST_LAYOUT_DOCK, LIST_LAYOUT_FLYOUT];

export const SORT_STRATEGY = [
  {id: CUSTOM_SORT, type: 'CUSTOM_SORT', name: 'sort.custom'},
  {id: VIEWER_SORT, type: 'VIEWER_SORT', name: 'sort.viewer'},
  {id: ALPHA_SORT, type: 'ALPHA_SORT', name: 'sort.alpha'},
]

// smartList: `items` stops being fixed ids and becomes a rule, re-evaluated on
// every poll tick against the followed channels. 'manual' is the default so
// every config saved before this option existed keeps behaving as a plain list.
export const SOURCE_KIND_MANUAL = 'manual';
export const SOURCE_KIND_GAME = 'game';
export const SOURCE_KIND_LANGUAGE = 'language';
export const SOURCE_KIND_FRESH = 'fresh';
export const SOURCE_KIND_OPTIONS = [
  {id: SOURCE_KIND_MANUAL, name: 'sourceKind.manual'},
  {id: SOURCE_KIND_GAME, name: 'sourceKind.game'},
  {id: SOURCE_KIND_LANGUAGE, name: 'sourceKind.language'},
  {id: SOURCE_KIND_FRESH, name: 'sourceKind.fresh'},
];

// Native names, not i18n keys: matches how Twitch's own directory language
// filter displays them, and avoids 30 entries x 15 locales for no benefit.
export const TWITCH_LANGUAGE_CODES = [
  {id: 'en', label: 'English'},
  {id: 'fr', label: 'Français'},
  {id: 'es', label: 'Español'},
  {id: 'de', label: 'Deutsch'},
  {id: 'it', label: 'Italiano'},
  {id: 'pt', label: 'Português'},
  {id: 'ru', label: 'Русский'},
  {id: 'ja', label: '日本語'},
  {id: 'ko', label: '한국어'},
  {id: 'zh', label: '中文'},
  {id: 'pl', label: 'Polski'},
  {id: 'tr', label: 'Türkçe'},
  {id: 'ar', label: 'العربية'},
  {id: 'th', label: 'ภาษาไทย'},
  {id: 'vi', label: 'Tiếng Việt'},
  {id: 'id', label: 'Bahasa Indonesia'},
  {id: 'ms', label: 'Bahasa Melayu'},
  {id: 'nl', label: 'Nederlands'},
  {id: 'sv', label: 'Svenska'},
  {id: 'fi', label: 'Suomi'},
  {id: 'da', label: 'Dansk'},
  {id: 'no', label: 'Norsk'},
  {id: 'cs', label: 'Čeština'},
  {id: 'hu', label: 'Magyar'},
  {id: 'ro', label: 'Română'},
  {id: 'sk', label: 'Slovenčina'},
  {id: 'bg', label: 'български'},
  {id: 'el', label: 'Ελληνικά'},
  {id: 'he', label: 'עברית'},
  {id: 'hi', label: 'हिन्दी'},
  {id: 'tl', label: 'Filipino'},
  {id: 'asl', label: 'American Sign Language'},
  {id: 'other', label: 'Other'},
];

// Built fresh on every use, like createNewList(): a shared reference would let
// one list's rule edits corrupt another's default.
export function createDefaultSource() {
  return {
    kind: SOURCE_KIND_MANUAL,
    game_id: null,
    game_name: null,
    language: null,
    freshMinutes: 10
  };
}

/* Every colour holds at least 3.2:1 against both Twitch backgrounds
   (#18181b and #f7f7f8) so it stays legible on either theme. Colors the
   header bar, badge, icon and indent rail. */
export const THEME_COLOR = [
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
      [EXTENDEDS_ON_HOVER]: false,
      [EXTENDEDS_ON_CLICK]: true,
      [SHOW_EVEN_IF_NO_LIVE]: false
    },
    sort: SORT_STRATEGY[CUSTOM_SORT].id,
    source: createDefaultSource(),
    style: {
      theme: 0, // 0 = none, id into THEME_COLOR
      header: {
        headerColor: "#808080",
        borderColor: "#808080",
        borderWidth: null,
        borderRadius: null,
        [STYLE_PILL_HEADER]: false,
        [STYLE_HAS_BAR]: false
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
      viewerCountType: 2,
      [TYPE_CHEVRON]: false,
      [TYPE_EXCLUSIVE]: false,
      [TYPE_HEADLESS]: false,
      layout: LIST_LAYOUT_STACK,
      columns: 2, // split + grid
      maxItems: 0 // 0 = unlimited
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