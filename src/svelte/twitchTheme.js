// Twitch publishes its current theme as a class on <html>. The sidebar bundle
// runs in the page's main world, so it can read it without any messaging.
const LIGHT_CLASS = 'tw-root--theme-light';

/** True when Twitch renders in dark mode. Defaults to dark. */
export function readTwitchDark() {
    return !document.documentElement.classList.contains(LIGHT_CLASS);
}

/** Calls `cb` on every theme switch. Returns a teardown. */
export function watchTwitchTheme(cb) {
    const obs = new MutationObserver(() => cb(readTwitchDark()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
}
