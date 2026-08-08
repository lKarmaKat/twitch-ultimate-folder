# Ultimate Twitch Folders

## What is this extension for ?

This extension lets you reorganise the channels you follow on Twitch according to a configuration you build yourself. Instead of the single flat list Twitch gives you, your sidebar shows the structure you defined.

**Lists, sub-lists and sub-sub-lists**

You can group your channels into lists, nest a list inside another, and nest again one level deeper. This lets you separate your channels by game, by community, or by any criterion that suits you, at the level of detail you want.

**Sorting inside a list**

Inside each list you choose how the channels are ordered: by viewer count, in alphabetical order, or in a custom order that you set yourself by moving the channels around.

**Channels outside any list**

Channels you have not placed in any list are not lost: they stay grouped together and you can organise them too, so every channel you follow remains reachable from the sidebar.

**Offline channels are never displayed**

A channel that is not streaming never appears in the sidebar. This also applies to the lists themselves: a list whose channels are all offline disappears entirely, so the sidebar only ever shows what you can actually watch right now.

If you want a list to stay visible even when nobody in it is live, turn on its **Always show** behaviour. A list also stays visible when one of its sub-lists has something live in it, or when it contains the « All other channels » element.

## How to report issues

Bugs are reported on GitHub: [open an issue](https://github.com/lKarmaKat/twitch-ultimate-folder/issues/new).

A report is only useful if it can be reproduced. Please include:

- **What you expected, and what happened instead.** One sentence each is enough.
- **The steps to reproduce it**, from a fresh Twitch page. If it only happens with a particular configuration, say which shape it has — a list inside a list, an « All other channels » element somewhere, a specific sort mode.
- **Your browser and its version**, and the extension version.
- **Whether it survives a reload** of the Twitch page, and whether it survives disabling your other extensions. BTTV, FrankerFaceZ and ad blockers modify the same sidebar and are the usual suspects.

Two sets of logs matter, and they are not in the same place:

- **The page console** — press `F12` on the Twitch tab, open the *Console* tab, reproduce the bug, and copy what appears. This covers the sidebar and the configuration window.
- **The service worker console** — go to `chrome://extensions`, enable developer mode, find Ultimate Twitch Folders, and click *service worker* under « Inspect views ». This covers everything that talks to the Twitch API: polling, token refresh, storage.

A short screen recording is often worth more than a long description, especially for anything involving drag and drop.

## Support me

This extension is free, has no ads and collects nothing. If it earned a place in your sidebar and you would like to give something back, a coffee is always welcome — and entirely optional. Starring the repository or reporting a bug helps just as much.

<!-- TODO: replace with the real Ko-fi link -->
[☕ Support me on Ko-fi](https://ko-fi.com/karmakat__)
