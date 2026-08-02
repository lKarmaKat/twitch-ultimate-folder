import * as CST from '../constantes.js';
import { getSmartMatchedChannels } from './smartList.js';

/**
 * Does the config hold at least one channel anywhere in the tree? Tells
 * "nothing configured" from "configured, but nobody live". A smartList counts
 * as configured on its rule alone: 0 current matches isn't "nothing set up".
 */
export function hasAnyChannel(configManager, listId) {
	const list = configManager?.selectedConfig?.[listId];
	if (!list) return false;

	if (list.source && list.source.kind !== CST.SOURCE_KIND_MANUAL) return true;

	for (const item of list.items ?? []) {
		if (item.type === CST.TYPE_LIST) {
			if (hasAnyChannel(configManager, item.id)) return true;
		} else if (item.channel_id !== undefined && item.channel_id !== null) {
			return true;
		}
	}
	return false;
}

/**
 * A list shows content if it is flagged "show even if offline", holds a live
 * channel, "all others", a smartList match, or a sub-list that does. Shared with Display.
 */
export function hasVisibleContent(configManager, listId) {
	const list = configManager?.selectedConfig?.[listId];
	if (!list) return false;

	if (list.behavior?.[CST.SHOW_EVEN_IF_NO_LIVE]) return true;

	if (list.source && list.source.kind !== CST.SOURCE_KIND_MANUAL) {
		if (getSmartMatchedChannels(configManager, listId).length > 0) return true;
	}

	for (const item of list.items ?? []) {
		if (item.channel_id < 0) return true;
		if (item.type === CST.TYPE_LIST) {
			if (hasVisibleContent(configManager, item.id)) return true;
		} else if (configManager.getLiveChannel(item.channel_id)) return true;
	}
	return false;
}
