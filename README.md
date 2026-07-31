# Ultimate Twitch Folders

## What is this extension for?

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

## How to connect the first time

> [!IMPORTANT]
> This extension never reads your Twitch account on its own. To build your sidebar it needs the list of channels you follow, and Twitch only hands that list over if **you** allow it: you have to authorise the application on your account, once. As long as this is not done, the extension has access to nothing and your sidebar stays empty.

**Authorising the application**

1. In the Twitch sidebar, where the extension would normally show your folders, click **Authorise the extension**. An activation code appears.
2. Click the code. Twitch opens on **twitch.tv/activate** with the code already filled in.
3. Authorise the application to access your account.
<!-- Links stay this way for github compatibility -->
<!-- <figure> -->
https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
<!-- <figcaption>Authorising the application from the Twitch sidebar.</figcaption> -->
<!-- </figure> -->

That is all. The sidebar fills itself in after a few seconds, and you will not be asked again — the extension keeps the authorisation alive on its own. You can revoke it at any time from your Twitch settings, under **Connections**.

## How to create a configuration

### Opening the configuration window

Click the extension icon in your browser toolbar.

Then click the **Open config popup** button. The configuration window opens on top of Twitch.

<details>
<summary><b>How to find the extension icon</b></summary>

<!-- <figure> -->
https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8

  <!-- <figcaption>How to find the extension icon.</figcaption> -->
<!-- </figure> -->

Depending on your browser, the icon may be hidden behind the extensions puzzle piece. Pin it once and it stays in the toolbar.

</details>

<!-- <figure> -->

https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
<!-- <figcaption>Opening the configuration window from the action popup.</figcaption> -->
<!-- </figure> -->

**The four sections of the window**

The window is split into four sections, from left to right.

1. **The channels you follow**
   The full list of channels you follow, with a search field to find one quickly. This is where you pick the channels to place in your configuration.

2. **The current configuration**
   The structure you are building. Here you add new lists, nest them, and rename them.

3. **The configuration panel**
   The settings of the selected element. It stays empty until you click the header of a list, or the configuration button of an « All other channels » element. You then set the behaviour, the sort order and the style of that element.

4. **The preview**
   A live preview of your configuration, which behaves exactly as it will in the Twitch sidebar once saved.

<!-- <figure> -->
https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
<!-- <figcaption>Detail of the sections.</figcaption> -->
<!-- </figure> -->

### How to create a list, and change its name and behaviour

In the second section, click the **+** button to add a new list. The list appears with a default name; click its header to select it, and the configuration panel on the right fills up with its settings. From there you rename it and set how it behaves in the sidebar.

<!-- <figure> -->
https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
<!-- <figcaption>Adding a new list and changing its behaviour.</figcaption> -->
<!-- </figure> -->

#### How to delete a channel/list

Every channel and every list in your configuration carries a **✕** button. Clicking it removes the element from the configuration. Removing a list also removes everything it contained — the channels are not deleted from your Twitch follows, they simply go back to being unplaced.

<!-- <figure> -->
https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
  <!-- <figcaption>How to remove a channel/list.</figcaption> -->
<!-- </figure> -->

<details>
<summary><b>How to rename a list</b></summary>

Select the list by clicking its header, then edit the **List name** field in the configuration panel. The name updates live in the preview.

<!-- <figure> -->
https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
<!-- <figcaption>Renaming a list from the configuration panel.</figcaption> -->
<!-- </figure> -->

</details>

<details>
<summary><b>More about list behaviour</b></summary>

A list has four independent behaviour switches. They control when the list opens and when it is shown at all.

- **Extended on startup** — the list is already expanded when Twitch loads. Turn it off for lists you only want to check occasionally.
- **Extends on hover** — the list opens as soon as the mouse passes over its header, and closes when you leave it. Convenient for glancing at a list without clicking.
- **Extends on click** — clicking the header opens or closes the list. Leave this on unless you want a list that can only be opened by hovering.
- **Always show** — the list stays in the sidebar even when none of its channels are live. Off by default: a list with nobody streaming disappears entirely.

**Sort mode**

Three sort modes are available: **Custom sort**, **Viewer count sort** and **Alpha sort**.

⚠️ **Use viewer count and alphabetical sorting only on lists that contain channels and nothing else.** A sub-list has no viewer count and no channel name to compare, so when a list mixes channels and sub-lists these two modes cannot order it in a way that makes sense — the position of the sub-lists becomes unpredictable.

The rule of thumb: **Custom sort** on any list that holds sub-lists, so you decide where each sub-list sits, and viewer count or alphabetical on the leaf lists that only hold channels.

<!-- TODO screenshot: src/assets/screenshots/list-behaviour.png -->
<figure>
  <img src="https://placehold.co/600x400" alt="The behaviour and sort mode settings in the configuration panel" width="600">
  <figcaption>The behaviour switches and the sort mode selector.</figcaption>
</figure>

</details>

<details>
<summary><b>More about list header icons</b></summary>

Each list can display an icon to the left of its name, so you recognise it in the sidebar without reading it.

Two families are available: neutral shapes — folder, dot, angle, cross — and around forty game logos, from Valorant and League of Legends to Counter-Strike 2, Fortnite, Minecraft, GTA, Apex Legends or Marvel Rivals. Pick the game logo when a list is dedicated to one game, and a neutral shape when the list groups channels by community or by mood.

The header also carries a coloured side bar, available in purple, green or orange. Combined with the icon, it gives each list a signature you can spot at a glance in a long sidebar.

<!-- TODO screenshot: src/assets/screenshots/list-header-icons.png -->
<figure>
  <img src="https://placehold.co/600x400" alt="The icon picker and the side bar colour selector" width="600">
  <figcaption>The list header icon picker and the side bar colours.</figcaption>
</figure>

</details>

<details>
<summary><b>More about list header badges</b></summary>

The badge on a list header tells you how many of its channels are online, so you know whether it is worth opening before you open it.

Five styles are available:

- **Bare counter** — the number on its own, no decoration.
- **Badge** — the number inside a filled pill.
- **Naked badge** — the same pill, stripped down.
- **With total channel count** — how many are live out of how many the list contains.
- **With total channel count and live/offline icon** — the same, plus an icon showing the live state.

They all report the same information; what changes is how much room it takes and how loud it looks. Pick the compact ones for a sidebar with many lists, and the detailed ones when you only have a few.

<!-- TODO screenshot: src/assets/screenshots/list-header-badges.png -->
<figure>
  <img src="https://placehold.co/600x400" alt="The five badge styles side by side" width="600">
  <figcaption>The five badge styles, side by side.</figcaption>
</figure>

</details>

### How to add a channel in a list

Drag a channel from the first section — the channels you follow — and drop it into a list of the second section. Use the search field above the list to find a channel quickly instead of scrolling.

<!-- <figure> -->
https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
<!-- <figcaption>Adding channels to a list.</figcaption> -->
<!-- </figure> -->

### How to move a channel/list

Dragging works inside the configuration too. Grab a channel to move it from one list to another, or grab a list by its header to move the whole list, with everything inside it, somewhere else in the structure.

<!-- <figure> -->
  https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
  <!-- <figcaption>Moving a channel and a list inside the configuration.</figcaption> -->
<!-- </figure> -->

### Specific element in the channels list

The channels list contains one special element: **All other channels**. It stands for every channel you follow that you have not placed anywhere, and it can be dragged into a list like any channel. Wherever you drop it, the channels it represents are displayed there.

It has its own configuration, reached through its settings button rather than by clicking a header. You choose its sort order, and whether it shows a header:

- **None** — the channels are displayed directly, with no header above them.
- **Sortable header** — a clickable header appears. Clicking it switches the sort between alphabetical and viewer count for the current session only, without touching your saved configuration.

<!-- <figure> -->
  https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
  <!-- <figcaption>Dragging the « All other channels » element and setting it up.</figcaption> -->
<!-- </figure> -->

### Saving

Do not forget to save your configuration before closing the window: any change that has not been saved is lost.

## More details about the action popup

The action popup — the small panel that opens when you click the extension icon — carries the settings that apply to the extension as a whole, rather than to one list.

**Channel alignment**

This setting aligns the extension's lists with the side your Twitch sidebar sits on: it decides whether nested lists and their channels are indented from the left or from the right.

<!-- <figure> -->
 https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
  <!-- <figcaption>Switching the side the lists are aligned to.</figcaption> -->
<!-- </figure> -->

**Title side**

This setting controls which side the channel title appears on when you hover a live channel in the sidebar. Switch it to the other side if the title ends up under another panel — typically when BTTV has moved the chat layout around.

<!-- <figure> -->
 https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
  <!-- <figcaption>Changing the side the channel title is displayed on.</figcaption> -->
<!-- </figure> -->

**Language**

Pick your language from the list. Every open surface — the sidebar, the configuration window, this help page — updates straight away, with no page refresh.

<!-- <figure> -->
  https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
  <!-- <figcaption>Changing the language, applied live without a refresh.</figcaption> -->
<!-- </figure> -->

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
[☕ Support me on Ko-fi](https://ko-fi.com/YOUR_KOFI_HANDLE)
