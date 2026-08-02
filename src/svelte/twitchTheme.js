// Twitch publishes its current theme as a class on <html>. Purement DOM, donc
// lisible aussi bien depuis le monde isole du content script que depuis une
// page d'extension : seule la portee JS est isolee, pas le DOM.
export const LIGHT_CLASS = 'tw-root--theme-light';

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
