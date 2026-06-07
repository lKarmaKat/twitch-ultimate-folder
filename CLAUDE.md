# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ultimate Twitch Folders** is a Chrome/Edge/Firefox extension (Manifest v3) that lets users reorganize their followed Twitch channels into custom nested folder structures displayed in the Twitch sidebar.

## Commands

```bash
npm run dev              # Dev server (opens twitch-copy.html preview)
npm run build            # Build extension to dist/
npm run c:build          # Clean build (removes dist/ first)
npm run watch            # Build in watch mode
npm run check            # Type-check with svelte-check + tsc

npm run test             # Jest unit tests (token logic)
npm run test:coverage    # Jest with coverage report
npm run test:svelte      # Vitest component tests

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
4. **Action popup** (`src/action_popup/`) — extension toolbar popup for quick toggles (theme, alignment)

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
| `src/constantes.ts` | Message type constants, icon names, default config shape |

### Config data model

Config is stored in Chrome local storage keyed by `userId`. The root type is `UserConfigs` → `I_CONFIG` → `I_NEW_LIST`. Each list node has:
- `items`: channels (strings) or nested `I_NEW_LIST` objects
- `behavior`: expand-on-hover, expand-on-click, pinnable, etc.
- `style`: header/content colors, borders, border-radius
- `type`: header height, icon type, bar color, viewer count display
- `sort`: `ALPHA` | `VIEWER` | `CUSTOM`

### Message types (defined in `src/constantes.ts`)

`GET_STREAMS_REF`, `GET_CURRENT_CONFIGURATION`, `SAVE_CHANNELS_LIST`, `RESET_CONFIG`, `THEME`, `CHANGE_THEME`, `ALIGNMENT`, `CHANGE_ALIGNMENT`

### UI injection pattern

The content script uses `MutationObserver` to detect when Twitch's sidebar renders, then mounts Svelte components into shadow DOM containers. The sidebar UI uses `sidebar_inject.js` → `DisplayWrapper.svelte`; config modal uses `popup_inject.js` → `ConfigPopup.svelte`.

## Tech stack

- **Svelte 5** with runes (`$state`, `$derived`, `$effect`) — not the legacy Options API
- **TypeScript** strict mode, path aliases `@/*` and `@src/*`
- **Vite** + `@samrum/vite-plugin-web-extension` for extension bundling
- **svelte-dnd-action** for drag-and-drop channel reordering
- **Jest** for unit tests, **Vitest** for Svelte component tests, **Playwright** for E2E

## Build output

`dist/` contains the unpacked extension. Load it via `chrome://extensions` → "Load unpacked". The Vite config injects CSS into JS bundles and copies `manifest.json`, icons, and CSS assets into `dist/`.

## Default mode

You are in consultation mode (Ask). Strict rules:
- Answer concisely, no fluff
- NEVER propose modifying files unless I explicitly say "edit" or "apply"
- If you have a code suggestion, show it as a code block in chat only
- No unsolicited action plans