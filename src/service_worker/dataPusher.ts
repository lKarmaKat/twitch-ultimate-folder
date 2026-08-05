import { HttpError, findCause, logErrorChain } from './errors';
import type { TwitchApi } from "./twitch";
import type { StreamsInfos } from "./models/streamsInfos.model";
import { DataFormatter } from "./dataFormatter";
import { MAX_BACKOFF_INTERVAL, POLLING_INTERVAL } from '../constantes'
import { api } from '../browserApi'


export class DataPusher {
    dataFormatter;
    private twitchApi: TwitchApi;
    private sendCallback: (data: [number, StreamsInfos][]) => void;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private stopped = false;
    private started = false;
    private readyPromise: Promise<void> = Promise.resolve();
    private backoffUntil = 0;
    private consecutiveFailures = 0;
    private firstTickDone = false;

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
            // The first cycle always fetches: getConfig awaits it to serve the
            // ports that connected before the worker was ready.
            if (this.firstTickDone && !await this.hasVisibleConsumer()) return;

            const data = await this.dataFormatter.updateAll();
            // clearTimeout only cancels a pending timer, not an in-flight
            // request, which would push account A's channels to account B.
            if (this.stopped) return;
            this.consecutiveFailures = 0;
            this.backoffUntil = 0;
            this.sendCallback(data);
        } catch (error) {
            // Throwing here would be an unhandled rejection: we run inside a
            // setTimeout callback and nobody awaits this promise.
            if (!this.stopped) {
                this.registerFailure(error);
                logErrorChain("DataPusher.tick", error);
            }
        } finally {
            this.firstTickDone = true;
            this.scheduleNext();
        }
    }

    /**
     * No point spending the rate limit on a sidebar nobody is looking at. A tab
     * is a consumer only if it is the selected one of a non-minimized window.
     */
    private async hasVisibleConsumer(): Promise<boolean> {
        try {
            const tabs = await api.tabs.query({ active: true, url: 'https://www.twitch.tv/*' });
            if (tabs.length === 0) return false;

            const windows = await Promise.all(
                tabs.filter(tab => tab.windowId !== undefined)
                    .map(tab => api.windows.get(tab.windowId))
            );
            return windows.some(window => window.state !== 'minimized');
        } catch (error) {
            // Never let a browser API hiccup silence the poller for good.
            logErrorChain("DataPusher.hasVisibleConsumer", error);
            return true;
        }
    }

    private registerFailure(error: unknown): void {
        this.consecutiveFailures += 1;

        const serverDelay = findCause(error, HttpError)?.retryAfterMs;
        const delay = serverDelay ?? Math.min(
            POLLING_INTERVAL * 2 ** this.consecutiveFailures,
            MAX_BACKOFF_INTERVAL
        );

        this.backoffUntil = Date.now() + delay;
    }

    private getInterval(): number {
        const remaining = this.twitchApi.rateLimitRemaining;
        let interval = POLLING_INTERVAL;
        if (remaining < 200) interval = 60000;
        else if (remaining < 400) interval = 30000;
        else if (remaining < 600) interval = 12000;

        return Math.max(interval, this.backoffUntil - Date.now());
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
