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
        // Polling does not start here: with no account logged in there is
        // neither a usable token nor a recipient.
    }

    /** Starts the loop. No-op if already started or permanently stopped. */
    start(): void {
        if (this.started || this.stopped) return;
        this.started = true;
        this.readyPromise = this.tick();
    }

    /**
     * Permanent stop: a stopped instance never restarts. Account switches build
     * a new one, or DataFormatter's maps would keep the previous channels.
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
            // clearTimeout only cancels a pending timer, not an in-flight
            // request, which would push account A's channels to account B.
            if (this.stopped) return;
            this.sendCallback(data);
        } catch (error) {
            // Throwing here would be an unhandled rejection: we run inside a
            // setTimeout callback and nobody awaits this promise.
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
        if (this.stopped) return; // the loop's only exit point
        this.timer = setTimeout(() => {
            this.timer = null;
            void this.tick();
        }, this.getInterval());
    }

    async getConfig(): Promise<[number, StreamsInfos][]> {
        // readyPromise is only created by start(): without this guard a call
        // made before then would await a promise that never resolves.
        if (!this.started) return [];
        await this.readyPromise;
        return this.dataFormatter.getInfotoSend();
    }

}
