/**
 * `null` = no port answered since mount, `true` = connected, `false` = lost.
 * Without the third state, every page load would show the reconnect banner.
 */
export const portConnected = $state({ current: null });
export const parentFinalizeEvent = $state({ current: false });
export const configChangeEvent = $state({ current: null });
export const allOthersChannelSelectedEvent = $state({ current: null });
export const alignmentLeft = $state({ current: true });

/** Port reconnect backoff: 2, 4, 8 then 15 s. */
export const RECONNECT_BASE_DELAY = 2000;
export const RECONNECT_MAX_DELAY = 15000;

/**
 * `nextAttemptAt`: epoch ms of the next retry, 0 when connected. `delay`: the
 * current wait, from which the progress bar takes its (fixed) speed.
 */
export const reconnect = $state({ nextAttemptAt: 0, delay: RECONNECT_BASE_DELAY });
