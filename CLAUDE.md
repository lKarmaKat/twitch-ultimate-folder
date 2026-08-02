# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ultimate Twitch Folders** is a Chrome/Edge/Firefox extension (Manifest v3) that lets users reorganize their followed Twitch channels into custom nested folder structures displayed in the Twitch sidebar.

Still in development, no need to bother with updating existing configurations when making changes.

## Commands

```bash
npm run dev              # Dev server (opens twitch-copy.html preview)
npm run build            # Build extension to dist/
npm run c:build          # Clean build (removes dist/ first)
npm run watch            # Build in watch mode
npm run check            # Type-check with svelte-check + tsc

npm run test             # Jest unit tests (token logic)
npm run test:coverage    # Jest with coverage report

npm run e2e              # Playwright E2E (headless)
npm run e2e:headed       # Playwright with browser visible
npm run e2e:chromium     # Chromium only
npm run e2e:firefox      # Firefox only
```

## Architecture

### Extension layers

1. **Background service worker** (`src/service_worker/`) — runs persistently, owns all Twitch API calls and Chrome storage
2. **Content script** (`src/content_script/index.js`) — injected into `https://www.twitch.tv/*`, creates shadow DOM containers and iframes
3. **Svelte UI** (`src/svelte/`) — mounted into those shadow DOM containers by inject scripts
4. **Action popup** (`src/action_popup/`) — extension toolbar popup for quick toggles (channel alignment, title side)

### Data flow

```
Twitch API
    ↓ (every 6s via DataPoller)
background.ts → DataFormatter → portManager
    ↓ (Chrome port messaging)
content_script / iframes
    ↓
Svelte stores → Display components
```

### Key files

| File | Purpose |
|------|---------|
| `src/service_worker/background.ts` | Service worker entry point |
| `src/service_worker/token.ts` | OAuth2 token lifecycle (validate every 30min, auto-refresh) |
| `src/service_worker/twitch.ts` | Twitch Helix API wrapper (`/streams/followed`, `/channels/followed`) |
| `src/service_worker/dataPoller.ts` | 6-second polling loop |
| `src/service_worker/configManage.ts` | Chrome storage read/write for user config |
| `src/service_worker/portManager.ts` | Port-based messaging between background and pages |
| `src/svelte/configManager.svelte.ts` | Svelte store mirroring background config state |
| `src/svelte/components/Display.svelte` | Recursive folder tree renderer |
| `src/svelte/components/ConfigPopup.svelte` | Full config UI |
| `src/svelte/components/ConfigPannel.svelte` | Per-list options form (right pane of the config UI) |
| `src/constantes.ts` | Message type constants, icon names, option enums, default config shape |
| `src/i18n/index.ts` | Static locale loading, locale detection and persistence |

### Config data model

Config is stored in Chrome local storage keyed by `userId`. The root type is `UserConfigs` → `I_CONFIG` → `I_NEW_LIST`, a flat map of `listId` → list node (nesting is by reference, not containment). Each list node has:
- `items`: `{id, channel_id}` for a channel, `{id, type: 'list'}` pointing at another entry of the map for a sub-list. `channel_id < 0` is the "All other channels" pseudo-item, which carries its own options (`sort`, `type`, `height`, `iconType`)
- `behavior`: keyed by the `BEHAVIOUR` ids (expand on startup / hover / click, show even if offline)
- `style`: `header` / `content` sub-objects — colors, borders, and the `STYLE_OPTIONS` flags (`pillHeader`, `indentRail`, `hasBar`); `style.theme` is a `THEME_COLOR` id, coloring the header bar, badge, icon and indent rail (`hasBar` only controls whether the bar itself is drawn)
- `type`: `height` (`HEADER_HEIGHT_*`), `iconType` (`icons/index.ts`), `viewerCountType` (`COUNTER_TYPE`)
- `sort`: `CUSTOM_SORT` | `VIEWER_SORT` | `ALPHA_SORT`

### List layouts

`type.layout` (`LIST_LAYOUT_*` in `constantes.ts`) selects how a list renders its body in `Display.svelte`, `LIST_LAYOUT_STACK` (`0`) being the original row-per-channel behaviour so pre-layout configs keep rendering unchanged:
- `STACK` — default vertical list of rows.
- `SPLIT` — the list's own `items` hold only sub-list refs (`childListIds`); each child renders as a side-by-side column via `<Self forceVariant="split">`, headless (no own header, body always shown). The column caption (`split-col-cap`) shows that child's icon, name, and live count, sourced from the parent via `countsFor(childId)`.
- `TABS` — same child-list-refs shape as `SPLIT`, but one child renders at a time (`activeChildId`), selected from a tab row in the header instead of side-by-side.
- `GRID` — channels render in a CSS grid (`--grid-columns` from `type.columns`) instead of a stack.
- `DOCK` — channels render as a horizontally scrollable row of avatar-only cells.
- `FLYOUT` — body renders in a separate floating panel (`FlyoutPopup.svelte`) positioned off the header's bounding rect on hover, instead of inline under the header.

`effectiveVariant` (`forceVariant ?? derived from layout`) picks which cell layout `DraggableChannel` renders: `'row'` (default), `'grid'`, `'split'` (avatar + name, viewer count below, used for `SPLIT` columns), or `'dock'` (avatar only, no name). `forceVariant` is how a `SPLIT` parent overrides its children's own layout for the body only — the child list keeps its own `type.layout` for everything else. The `headless` prop skips a child's own header entirely (used by both `SPLIT` columns and the active `TABS` panel), since the parent already renders the counter/name/tabs.

**Counter gotcha:** a `SPLIT`/`TABS` parent's own `items` hold only child-list refs, never `channel_id`s directly, so `countsFor(listId)` — the manual-set path — always returns `{live: 0, total: 0}` for that parent. The parent header's own badge (`channelsCounters` in `Display.svelte`) must instead sum `countsFor(childId)` over `childListIds` when `layout` is `SPLIT` or `TABS`; only leaf/non-split lists can read `countsFor(listId)` directly.

### Message types (defined in `src/constantes.ts`)

Config: `GET_STREAMS_REF`, `GET_CURRENT_CONFIGURATION`, `SAVE_CHANNELS_LIST`, `RESET_CONFIG`, `RESOLVE_UNFOLLOWED`.
UI/params: `DISPLAY_POPUP`, `HIDE_POPUP`, `OPEN_HELP_PAGE`, `ALIGNMENT`, `TITLE_SIDE`, `LOCALE` (each with its `CHANGE_`/`GET_` variants).
Auth/session: `START_AUTH`, `AUTH_STATE`, `AUTH_DEVICE_CODE`, `SESSION_USER_CHANGED`, `GET_SESSION_USER`, `IS_USER_LOGGED_IN`, `PORT_READY`.

### UI injection pattern

The content script uses `MutationObserver` to detect when Twitch's sidebar renders, then mounts Svelte components into shadow DOM containers. The sidebar UI uses `sidebar_inject.js` → `DisplayWrapper.svelte`; config modal uses `popup_inject.js` → `ConfigPopup.svelte`.

### Styling layers

Sidebar visuals are split in two: **structure** (layout, spacing, sizing) lives in the component `<style>` blocks, **theme colours** live in `src/assets/dark_channel.css`, which despite its name holds both the `#display-container.dark` *and* `.light` rule sets. `src/assets/light_channel.css` is dead weight (it says so itself) — don't add to it.

Header internals (paddings, icon slot, badge) are sized in `em`, so changing the header `font-size` scales the whole row coherently. Alignment-dependent rules are mirrored through the global `.al-left` / `.al-right` classes, and `Display.svelte` is recursive, so its own rules use the direct child combinator to avoid leaking a parent's settings onto children.

### Adding a list option

Options are stored in already-saved user configs, so backward compatibility drives the design:

1. **Declare the enum in `constantes.ts`** as an `{id, name}` array, `name` being an i18n key. Give the *current* behaviour `id: 0` so configs saved before the option existed keep rendering the same way and need no migration.
2. **Add the key to `createNewList()`** if it is a list-level option (under `style` or `type`).
3. **Bind it in `ConfigPannel.svelte`** with `SortSelect` (generic `{id, name}` select), and backfill the missing key in the existing `$effect` — old configs have no key to `bind:` on.
4. **Read it in `Display.svelte`** through a `$derived`, and drive rendering with a class + CSS rather than inline styles.
5. **Whitelist it in `cleanRecursively`** (`configManager.svelte.ts`) if it lives on an *item* rather than on the list node: that function rebuilds each item from an explicit field list on every save, so any field not named there is silently dropped. List-level `style` / `type` objects are saved as-is and need nothing.
6. **Add the i18n keys to all 15 locales** (see below).
7. **Check `e2e/const.js`** — its fixtures reference option constants by name.

### i18n

`src/i18n/locales/*.json`, 15 locales, loaded statically in `src/i18n/index.ts` (synchronous, so no loading flash inside the shadow DOM). `fallbackLocale` is `en`, so a missing key degrades to English rather than breaking — several locales already lag behind on recent keys.

Files are **CRLF, 2-space indented, with a trailing newline**, and round-trip exactly through `JSON.stringify(obj, null, 2)`. Scripting a bulk key insertion is safe as long as the CRLF and trailing newline are restored on write.

`$_()` cannot be used from a `.ts` file: constants in `constantes.ts` hold i18n *keys* (`label` / `tooltip` / `name`), resolved by the components.

## Tech stack

- **Svelte 5** with runes (`$state`, `$derived`, `$effect`) — not the legacy Options API
- **TypeScript** strict mode, path aliases `@/*` and `@src/*`
- **Vite** + `@samrum/vite-plugin-web-extension` for extension bundling
- **svelte-dnd-action** for drag-and-drop channel reordering
- **Jest** for unit tests, **Playwright** for E2E

## Testing notes

`npm run check` reports ~13 pre-existing warnings (unused CSS selectors, obsolete `svelte-ignore` codes); only the error count matters.

One E2E test fails on a clean checkout: `demo.test.ts` › *"dragging an element that is already in a list should'nt add it"* (chromium). Verify a failure against `git stash` before assuming a change caused it.

## Build output

`dist/` contains the unpacked extension. Load it via `chrome://extensions` → "Load unpacked". The Vite config injects CSS into JS bundles and copies `manifest.json`, icons, and CSS assets into `dist/`.

## Code conventions

- All code in English: identifiers, function names, strings, and comments. No French anywhere in the codebase.
- Minimal comments. Prefer self-explanatory naming over explanation.
- Only comment non-obvious logic (workarounds, Twitch DOM quirks, algorithmic tricks) — 2 lines maximum, and only for the most complex cases.
- Never write comments that restate what the code already says.

## Default mode

You are in consultation mode (Ask). Strict rules:
- Answer concisely, no fluff
- NEVER propose modifying files unless I explicitly say "edit" or "apply"
- If you have a code suggestion, show it as a code block in chat only
- No unsolicited action plans