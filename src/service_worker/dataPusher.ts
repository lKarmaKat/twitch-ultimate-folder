import { logErrorChain } from './errors';
import type { TwitchApi } from "./twitch";
import type { StreamsInfos } from "./models/streamsInfos.model";
import { DataFormatter } from "./dataFormatter";
import { POLLING_INTERVAL } from '../constantes'


export class DataPusher {
    dataFormatter;
    private twitchApi: TwitchApi;
    private sendCallback: (data: [number, StreamsInfos][]) => void;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private stopped = false;
    private started = false;
    private readyPromise: Promise<void> = Promise.resolve();

    constructor(twitchApi: TwitchApi, sendCallback: (data: [number, StreamsInfos][]) => void) {
        this.twitchApi = twitchApi;
        this.sendCallback = sendCallback;
        this.dataFormatter = new DataFormatter(twitchApi);
        // Le polling ne démarre pas ici : tant qu'aucun compte n'est connecté il
        // n'y a ni token utilisable ni destinataire, et démarrer d'office ferait
        // partir des requêtes Helix pour rien.
    }

    /** Démarre la boucle. Sans effet si déjà démarrée ou définitivement arrêtée. */
    start(): void {
        if (this.started || this.stopped) return;
        this.started = true;
        this.readyPromise = this.tick();
    }

    /**
     * Arrêt définitif : une instance stoppée ne redémarre pas. Au changement de
     * compte on en crée une neuve, sinon les Map de DataFormatter garderaient
     * les chaînes du compte précédent.
     */
    stop(): void {
        this.stopped = true;
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private async tick(): Promise<void> {
        try {
            const data = await this.dataFormatter.updateAll();
            // clearTimeout n'annule que le timer en attente, pas la requête déjà
            // partie. Sans ce garde, un updateAll() lancé avec le token du compte
            // A se résoudrait après le switch et pousserait ses chaînes aux
            // sidebars du compte B.
            if (this.stopped) return;
            this.sendCallback(data);
        } catch (error) {
            // Un throw ici serait une unhandled rejection : on est dans le
            // callback d'un setTimeout, plus personne n'attend cette promesse.
            if (!this.stopped) logErrorChain("DataPusher.tick", error);
        } finally {
            this.scheduleNext();
        }
    }

    private getInterval(): number {
        const remaining = this.twitchApi.rateLimitRemaining;
        if (remaining < 200) return 60000;
        if (remaining < 400) return 30000;
        if (remaining < 600) return 12000;
        return POLLING_INTERVAL;
    }

    private scheduleNext(): void {
        if (this.stopped) return; // seul point de sortie de la boucle
        this.timer = setTimeout(() => {
            this.timer = null;
            void this.tick();
        }, this.getInterval());
    }

    async getConfig(): Promise<[number, StreamsInfos][]> {
        // readyPromise n'est créée que par start() : sans ce garde, un appel
        // avant démarrage attendrait une promesse qui ne se résout jamais.
        if (!this.started) return [];
        await this.readyPromise;
        return this.dataFormatter.getInfotoSend();
    }

}
