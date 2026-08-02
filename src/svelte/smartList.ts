import * as CST from '../constantes';

/**
 * Ignores where a channel is already placed manually elsewhere: a smartList is
 * a live filter over all followed channels, not exclusive like "all others".
 */
export function channelMatchesSource(channel: any, rule: any): boolean {
	if (rule.kind === CST.SOURCE_KIND_GAME) {
		return !!channel.isLive && channel.game_id != null && String(channel.game_id) === String(rule.game_id);
	}
	if (rule.kind === CST.SOURCE_KIND_LANGUAGE) {
		return !!channel.isLive && !!rule.language && channel.language === rule.language;
	}
	if (rule.kind === CST.SOURCE_KIND_FRESH) {
		if (!channel.isLive || !channel.started_at) return false;
		const startedMinutesAgo = (Date.now() - Date.parse(channel.started_at)) / 60000;
		return startedMinutesAgo >= 0 && startedMinutesAgo <= (rule.freshMinutes ?? 10);
	}
	return false;
}

/** Shared by Display (rendering, badge counts) and listVisibility (show/hide). */
export function getSmartMatchedChannels(configManager: any, listId: string): any[] {
	const rule = configManager.selectedConfig[listId]?.source;
	if (!rule || rule.kind === CST.SOURCE_KIND_MANUAL) return [];
	return configManager.channelsPickRef.filter((ch: any) => ch.channel_id > 0 && channelMatchesSource(ch, rule));
}
