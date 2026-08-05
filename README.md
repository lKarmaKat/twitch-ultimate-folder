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

That is all. The sidebar fills itself in after a few seconds, and you will not be asked again — the extension keeps the authorisation alive on its own.

### How to revoke access

Twitch is what grants and revokes this authorisation, not the extension, so nothing needs to be uninstalled or reset here: it all happens from your Twitch account.

1. Go to your Twitch **Settings → Connections**.
2. Find **Ultimate Twitch Folders** in the **Other Connections** list.
3. Click **Disconnect**.

The extension loses access right away. Your configuration itself is not deleted — it is only waiting for a new authorisation to fill itself back in — and the sidebar prompts you to authorise again the next time it needs the list of channels you follow.

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
- **One sub-list at a time** — opening one of this list's sub-lists closes the others, so only one stays expanded. Useful on a list holding several sub-lists, to stop the sidebar growing too tall when more than one of them is open at once.

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
<summary><b>More about list style</b></summary>

Beyond behaviour and sort order, every list carries its own look: how its content is arranged, what colour it uses, and how its header is drawn. All of it lives in the same configuration panel, under **Style**.

#### Layout

The **Layout** option chooses how a list arranges what it holds. Every layout still renders the same channels — only the shape changes.

- **Rows (default)**
  Channels are stacked vertically under the header, one per row — the way every list looked before layouts existed.
  <!-- TODO screenshot: src/assets/screenshots/layout-stack.png -->
  <img src="https://placehold.co/220x140" alt="Rows layout" width="220"><br>

- **Split columns**
  The list's own items become sub-lists rendered side by side as columns instead of nested inside each other. Each column shows its own icon, name and live count above its channels. Build the sub-lists first, then set this layout on the list that should hold them as columns.
  <!-- TODO screenshot: src/assets/screenshots/layout-split.png -->
  <img src="https://placehold.co/220x140" alt="Split columns layout" width="220"><br>

- **Flyout panel**
  The channels stay hidden until you hover the header, then open in a floating panel next to it instead of pushing the rest of the sidebar down. Handy for a list you check often but do not want taking up permanent space.
  <!-- TODO screenshot: src/assets/screenshots/layout-flyout.png -->
  <img src="https://placehold.co/220x140" alt="Flyout panel layout" width="220"><br>

- **Tabs**
  Like split columns, the list's items are sub-lists, but they share one space instead of sitting side by side: a tab row appears in the header and only one sub-list is shown at a time.
  <!-- TODO screenshot: src/assets/screenshots/layout-tabs.png -->
  <img src="https://placehold.co/220x140" alt="Tabs layout" width="220"><br>

- **Grid**
  Channels arrange themselves in a grid instead of a single column, so more of them fit in the same height. Set the number of columns with the **Columns** option that appears once this layout is picked.
  <!-- TODO screenshot: src/assets/screenshots/layout-grid.png -->
  <img src="https://placehold.co/220x140" alt="Grid layout" width="220"><br>

- **Dock (avatars only)**
  Channels shrink down to their avatar only, laid out in a horizontally scrolling row — the most compact layout, at the cost of not showing names.
  <!-- TODO screenshot: src/assets/screenshots/layout-dock.png -->
  <img src="https://placehold.co/220x140" alt="Dock layout" width="220"><br>

#### Colours

Each list can be given a theme colour, chosen from a palette of thirteen colours picked to stay readable on both the dark and the light Twitch theme. Whichever colour you pick is applied in four places at once: the header's side bar, the header badge, the header icon and the indent rail — one choice instead of four.

Leaving the colour on **None**, the default, does not turn any of those four off: the side bar (if enabled) falls back to the extension's own purple, the badge keeps its plain uncoloured look, and the icon matches your sidebar's text colour. Picking a colour overrides all of that at once.

<!-- TODO screenshot: src/assets/screenshots/list-colors.png -->
<figure>
  <img src="https://placehold.co/600x400" alt="The theme colour picker" width="600">
  <figcaption>Picking a list's theme colour.</figcaption>
</figure>

#### Rounded header, indent rail and bar

- **Rounded header** — rounds the corners of the list header, and highlights it on mouse hover. When **Bar** is also on, the side bar follows the rounded corner instead of staying square.
- **Indent rail** — indents the list's content and draws a vertical line down the gutter, in the list's colour. Invisible on a list left at the default colour.
- **Bar** — draws a coloured bar on the side of the header, in the list's colour.

#### Header size

- **Medium (default)** — the standard row height, with room for the icon.
- **Small** — a more compact header with no icon slot, for a denser sidebar.

#### List icon

Each list can display an icon to the left of its name, so you recognise it in the sidebar without reading it.

Two families are available: neutral shapes — folder, dot, angle, cross — and around forty game logos, from Valorant and League of Legends to Counter-Strike 2, Fortnite, Minecraft, GTA, Apex Legends or Marvel Rivals. Pick the game logo when a list is dedicated to one game, and a neutral shape when the list groups channels by community or by mood.

<!-- TODO screenshot: src/assets/screenshots/list-header-icons.png -->
<figure>
  <img src="https://placehold.co/600x400" alt="The icon picker" width="600">
  <figcaption>The list header icon picker.</figcaption>
</figure>

#### Badge

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

<details>
<summary><b>More about list content</b></summary>

By default, a list's channels are whatever you place in it by hand. A list can instead fill itself automatically from a rule, re-evaluated continuously as channels go live or offline — pick it from the **List content** option in the configuration panel.

⚠️ **A list driven by a rule ignores its manually placed items.** Whatever channels you drag into it are never shown once its content is set to anything other than **Manual** — remove the list's items or leave it empty, it makes no difference.

Three rules are available, and all three only ever match channels you follow, live at the moment they are checked:

- **By game** — the list follows a Twitch category. Search among the categories your followed channels are currently streaming in, or search the full Twitch directory, and every followed channel live in that category shows up here.
- **By language** — the list follows a stream language. Every followed channel currently live in that language shows up here.
- **Just started** — the list follows freshness rather than a category or language: every followed channel that went live within the last X minutes shows up here, X being a number of minutes you set yourself. A channel drops out on its own once it crosses that age, with nothing to touch in the configuration.

A rule is not exclusive the way the « All other channels » element is: a channel matching one can also sit in one of your own manually built lists at the same time, and it will show up in both places.

<!-- TODO screenshot: src/assets/screenshots/list-content.png -->
<figure>
  <img src="https://placehold.co/600x400" alt="The list content rule picker" width="600">
  <figcaption>Setting a list's content to an automatic rule.</figcaption>
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

### Saving, transferring and cleaning up your configuration

#### Saving

Do not forget to save your configuration before closing the window: any change that has not been saved is lost.

#### Exporting and importing a configuration

Use **Export** to turn your current configuration — including any change not yet saved — into a text blob you can copy and store somewhere safe, or send to another machine. Use **Import** to load a blob back in: it replaces the configuration you are currently editing, so save your own work first if you want to keep it.

> [!WARNING]
> Import overwrites the configuration you are editing. It only replaces it in the window — nothing is saved until you click **Save**, so closing the window instead discards the import.

<!-- TODO screenshot: src/assets/screenshots/export-import.png -->
<figure>
  <img src="https://placehold.co/600x400" alt="The export and import buttons and their modals" width="600">
  <figcaption>Exporting a configuration to a text blob, and importing one back in.</figcaption>
</figure>

#### Removing channels you no longer follow

A configuration can end up referencing a channel you no longer follow — you unfollowed it on Twitch, or you imported a configuration built from someone else's follows. When this happens, a **Clean up** button appears next to Save, showing how many such channels were found. Clicking it removes them from the configuration you are editing; the lists that held them are kept, since you built them by hand. As with everything else here, nothing is saved until you click **Save**.

<!-- TODO screenshot: src/assets/screenshots/clean-unfollowed.png -->
<figure>
  <img src="https://placehold.co/600x400" alt="The clean-up button next to Save" width="600">
  <figcaption>Removing channels that are no longer followed from the configuration.</figcaption>
</figure>

## More details about the action popup

The action popup — the small panel that opens when you click the extension icon — carries the settings that apply to the extension as a whole, rather than to one list.

**Channel alignment**

This setting aligns the extension's lists with the side your Twitch sidebar sits on: it decides whether nested lists and their channels are indented from the left or from the right.

<!-- <figure> -->
 https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
  <!-- <figcaption>Switching the side the lists are aligned to.</figcaption> -->
<!-- </figure> -->

**Flyout panel side**

Lists using the flyout panel layout show their content in a floating panel next to their header. This setting decides which side that panel opens on. *Auto* measures the room available beside the sidebar and picks the side where the panel fits, so it stays on screen even when the sidebar sits on the right or the window is narrow. Pick a fixed side only if you want the panel to always open there.

<!-- <figure> -->
 https://github.com/user-attachments/assets/0ddc5818-8131-472b-aacb-546bbb880ee8
  <!-- <figcaption>Choosing the side the flyout panel opens on.</figcaption> -->
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
[☕ Support me on Ko-fi](https://ko-fi.com/karmakat__)
