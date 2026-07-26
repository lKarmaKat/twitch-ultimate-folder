/**
 * `null` = aucun port n'a encore repondu depuis le montage, `true` = connecte,
 * `false` = connexion perdue. Le troisieme etat n'est pas cosmetique : avec un
 * simple booleen, « pas encore connecte » et « deconnecte » sont la meme valeur,
 * et le bandeau de reconnexion s'affichait donc a chaque chargement de page.
 */
export const portConnected = $state({ current: null });
export const parentFinalizeEvent = $state({ current: false });
export const configChangeEvent = $state({ current: null });
export const allOthersChannelSelectedEvent = $state({ current: null });
export const alignmentLeft = $state({ current: true });

/** Backoff de reconnexion des ports : 2, 4, 8 puis 15 s. */
export const RECONNECT_BASE_DELAY = 2000;
export const RECONNECT_MAX_DELAY = 15000;

/**
 * `nextAttemptAt` : instant (epoch ms) de la prochaine tentative de reconnexion,
 * 0 quand le port est connecté. `delay` : durée de l'attente en cours, dont la
 * barre de progression tire sa vitesse — la déduire de l'échéance moins l'heure
 * courante la ferait varier à chaque image.
 * Écrit par le seul port `eventbus` (cf. PortConnector.drivesUi), lu par
 * PortDisconnected qui en tire son compte à rebours.
 */
export const reconnect = $state({ nextAttemptAt: 0, delay: RECONNECT_BASE_DELAY });
