# Privacy Policy — Ultimate Twitch Folders

Last updated: 2026-10-07

## Data collected

Ultimate Twitch Folders uses the Twitch API (OAuth) to access the list of
channels you follow. As part of this, the following data is stored locally,
in your browser's storage (`chrome.storage.local`):

- your Twitch user ID
- your Twitch OAuth access token and refresh token
- the list of channels you follow and their status (technical cache)
- your custom folder configuration

## Use of data

This data is used exclusively to make the extension work (displaying your
followed channels organized into folders). It is never transmitted to any
third-party server or to the extension's author: the only external service
contacted to use it is Twitch's official API (twitch.tv / id.twitch.tv),
directly from your browser. The only other connection is the anonymous usage
statistics described below, which contain none of this data.

## Anonymous usage statistics (Chrome only)

The Chrome version of the extension, installed from the Chrome Web Store
(including on Edge), sends an anonymous summary of how your lists are
organized at most once a week. It tells the author which features are actually
used. The Firefox version sends nothing.

The summary contains:

- the extension version
- the month the extension was installed, or a note that it was installed
  before these statistics existed
- the number of configurations saved for each Twitch account used in the
  browser
- for each list of the current configuration: its layout, its sort order, its
  source (manual, by game, by language, recent channels), how deeply it is
  nested, how many channels and sub-lists it holds, and whether it holds the
  "All other channels" item

The summary never contains your Twitch ID or name, your tokens, the channels
you follow or have organized, the names of your lists, or any installation
identifier. Nothing links two summaries together or ties them to a person. To
keep to the weekly rhythm, the extension stores its install date and the date
of the last summary locally.

The summary is sent to a server hosted on Cloudflare (Workers and D1) and run
by the extension's author. Like any request on the Internet, it travels from
your IP address, but the server does not record it. Summaries are kept for at
most 25 months, then deleted automatically.

To stop sending anything, turn off "Anonymous usage statistics" in the panel
that opens when you click the extension's icon. Since no summary is tied to
you, the ones already received cannot be found to be deleted: they disappear
at the end of the retention period.

## Data sharing

No data is sold, rented, or shared with third parties. Cloudflare only hosts
the anonymous statistics on the author's behalf.

## Retention and deletion

Data is kept in your browser's local storage for as long as the extension is
installed. Uninstalling the extension, or revoking authorization from
https://www.twitch.tv/settings/connections, removes access and the stored
data.
