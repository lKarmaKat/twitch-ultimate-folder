import * as CST from '../constantes.js';

/**
 * Une liste a du contenu à afficher si :
 *  - elle est marquée "afficher même si aucune chaîne en ligne", ou
 *  - elle contient "All other channels", ou
 *  - elle contient une chaîne live, ou
 *  - une de ses sous-listes a du contenu à afficher.
 *
 * Le test du flag est placé avant la boucle : une liste marquée mais vide
 * s'affiche aussi (header + corps vide), ce qui est ce que Display rendrait.
 *
 * Partagé entre Display (visibilité d'une liste) et DisplayWrapper (afficher
 * l'arbre ou le message de repli) : les deux doivent répondre à la même
 * question, sinon le wrapper masque des listes que Display aurait affichées.
 */
/**
 * La configuration contient-elle au moins une chaine, quelque part dans l'arbre ?
 * Sert à distinguer « rien de configuré » (l'utilisateur doit être guidé) de
 * « configuré, mais personne en ligne » (il n'y a rien à faire).
 */
export function hasAnyChannel(configManager, listId) {
	const list = configManager?.selectedConfig?.[listId];
	if (!list) return false;

	for (const item of list.items ?? []) {
		if (item.type === CST.TYPE_LIST) {
			if (hasAnyChannel(configManager, item.id)) return true;
		} else if (item.channel_id !== undefined && item.channel_id !== null) {
			return true;
		}
	}
	return false;
}

export function hasVisibleContent(configManager, listId) {
	const list = configManager?.selectedConfig?.[listId];
	if (!list) return false;

	if (list.behavior?.[CST.SHOW_EVEN_IF_NO_LIVE]) return true;

	for (const item of list.items ?? []) {
		if (item.channel_id < 0) return true;
		if (item.type === CST.TYPE_LIST) {
			if (hasVisibleContent(configManager, item.id)) return true;
		} else if (configManager.getLiveChannel(item.channel_id)) return true;
	}
	return false;
}
