/**
 * `null` = no port answered since mount, `true` = connected, `false` = lost.
 * Without the third state, every page load would show the reconnect banner.
 */
export const portConnected = $state({ current: null });
/**
 * Extension rechargee, mise a jour ou desactivee : le contexte de ce content
 * script est mort et ne reviendra pas. Distinct de `portConnected`, qui decrit
 * une coupure dont on se remet tout seul.
 */
export const contextLost = $state({ current: false });
export const parentFinalizeEvent = $state({ current: false });
export const configChangeEvent = $state({ current: null });
export const allOthersChannelSelectedEvent = $state({ current: null });
export const alignmentLeft = $state({ current: true });
/** true = channel title pops up on the left of the row. Default: on the right. */
export const titleSideLeft = $state({ current: false });
/** true = channel rows highlight on hover. Default false: today's look, unchanged. */
export const skinModern = $state({ current: false });

/** Port reconnect backoff: 2, 4, 8 then 15 s. */
export const RECONNECT_BASE_DELAY = 2000;
export const RECONNECT_MAX_DELAY = 15000;

/**
 * `nextAttemptAt`: epoch ms of the next retry, 0 when connected. `delay`: the
 * current wait, from which the progress bar takes its (fixed) speed.
 */
export const reconnect = $state({ nextAttemptAt: 0, delay: RECONNECT_BASE_DELAY });
