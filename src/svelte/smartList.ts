import * as CST from '../constantes';

/**
 * A rule saved before the category cycle held one category inline, so both
 * shapes stay readable: this is the only place that knows about either.
 */
export function getSourceGames(source: any): any[] {
	if (Array.isArray(source?.games) && source.games.length) return source.games;
	if (source?.game_id) return [{ id: source.game_id, name: source.game_name }];
	return [];
}

/**
 * Keeps a version without the cycle able to read a rule this one saved. Reads
 * `games` directly: going through the fallback would mirror the legacy field
 * back onto itself and resurrect a category just removed from an empty cycle.
 */
export function mirrorLegacyGame(source: any): void {
	const first = Array.isArray(source?.games) ? source.games[0] : undefined;
	source.game_id = first?.id ?? null;
	source.game_name = first?.name ?? null;
}

/**
 * Ignores where a channel is already placed manually elsewhere: a smartList is
 * a live filter over all followed channels, not exclusive like "all others".
 */
export function channelMatchesSource(channel: any, rule: any): boolean {
	if (rule.kind === CST.SOURCE_KIND_GAME) {
		if (!channel.isLive || channel.game_id == null) return false;
		return getSourceGames(rule).some(g => String(g.id) === String(channel.game_id));
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

/**
 * Shared by Display (rendering, badge counts) and listVisibility (show/hide).
 * Without `gameId` it returns the whole rule: visibility must consider every
 * category of the cycle, while the body only renders the displayed one.
 */
export function getSmartMatchedChannels(configManager: any, listId: string, gameId: string | null = null): any[] {
	const rule = configManager.selectedConfig[listId]?.source;
	if (!rule || rule.kind === CST.SOURCE_KIND_MANUAL) return [];
	return configManager.channelsPickRef.filter((ch: any) =>
		ch.channel_id > 0
		&& channelMatchesSource(ch, rule)
		&& (gameId == null || String(ch.game_id) === String(gameId)));
}
