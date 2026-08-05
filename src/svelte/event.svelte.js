import * as CST from '../constantes.js';

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
/** A FLYOUT_SIDE_* id: side the flyout panel opens on, auto by default. */
export const flyoutSide = $state({ current: CST.FLYOUT_SIDE_AUTO });

/**
 * flyoutList bridge: the sidebar (inside its own shadow root) and FlyoutPopup
 * (mounted in a separate one on document.body) share no component tree, so the
 * hover-open/hover-close handoff between them goes through this module-level
 * state instead of props.
 */
export const flyoutState = $state({ listId: null, top: 0, left: 0, right: 0, side: 'right' });
let flyoutCloseTimer = null;

export function openFlyout(listId, rect) {
	clearTimeout(flyoutCloseTimer);
	flyoutState.listId = listId;
	flyoutState.top = rect.top;
	flyoutState.left = rect.left;
	flyoutState.right = rect.right;
	flyoutState.side = pickFlyoutSide(rect);
}

// Auto measures the room around the header instead of reading the alignment: a
// collapsed or narrow sidebar says nothing about the space left beside it.
function pickFlyoutSide(rect) {
	if (flyoutSide.current === CST.FLYOUT_SIDE_LEFT) return 'left';
	if (flyoutSide.current === CST.FLYOUT_SIDE_RIGHT) return 'right';
	const roomRight = window.innerWidth - rect.right;
	if (roomRight >= CST.FLYOUT_PANEL_WIDTH) return 'right';
	return rect.left >= CST.FLYOUT_PANEL_WIDTH || rect.left > roomRight ? 'left' : 'right';
}

// Grace period: lets the pointer travel from the header to the panel, which
// sits right next to it, without the panel closing first.
export function scheduleCloseFlyout(listId) {
	clearTimeout(flyoutCloseTimer);
	flyoutCloseTimer = setTimeout(() => {
		if (flyoutState.listId === listId) flyoutState.listId = null;
	}, 200);
}

export function keepFlyoutOpen() {
	clearTimeout(flyoutCloseTimer);
}

export function closeFlyout() {
	clearTimeout(flyoutCloseTimer);
	flyoutState.listId = null;
}

/** Port reconnect backoff: 2, 4, 8 then 15 s. */
export const RECONNECT_BASE_DELAY = 2000;
export const RECONNECT_MAX_DELAY = 15000;

/**
 * `nextAttemptAt`: epoch ms of the next retry, 0 when connected. `delay`: the
 * current wait, from which the progress bar takes its (fixed) speed.
 */
export const reconnect = $state({ nextAttemptAt: 0, delay: RECONNECT_BASE_DELAY });
