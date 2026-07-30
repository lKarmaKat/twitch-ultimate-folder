/**
 * Point d'accès unique à l'API WebExtension.
 *
 * Firefox expose `browser` (promesses, documentées) et `chrome` (callbacks) ;
 * Chrome n'expose que `chrome`, qui renvoie des promesses depuis MV3. Prendre
 * `browser` en priorité donne donc des promesses garanties des deux côtés,
 * sans dépendre du comportement non documenté de `chrome.*` sous Firefox.
 *
 * Corollaire : on n'utilise JAMAIS la forme à callback, et donc jamais
 * `runtime.lastError` — les erreurs arrivent en rejet de promesse.
 */
export const api: typeof chrome = (globalThis as any).browser ?? chrome;

export default api;
