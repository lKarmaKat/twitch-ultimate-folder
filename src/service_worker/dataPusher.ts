import { wrapError } from './errors';
import type { TwitchApi } from "./twitch";
import type { StreamsInfos } from "./models/streamsInfos.model";
import { DataFormatter } from "./dataFormatter";
import { POLLING_INTERVAL } from '../constantes'


export class DataPusher {
    dataFormatter;
    private twitchApi: TwitchApi;
    private readyPromise: Promise<void>;

    constructor(twitchApi: TwitchApi, sendCallback: any) {
        this.twitchApi = twitchApi;
        this.dataFormatter = new DataFormatter(twitchApi);
        this.readyPromise = this.runFirstPoll(sendCallback).catch(() => {});
    }

    private async runFirstPoll(sendCallback: any): Promise<void> {
        try {
            const data = await this.dataFormatter.updateAll();
            sendCallback(data);
        } catch (error) {
            throw wrapError("DataPusher.runFirstPoll failed", error);
        } finally {
            this.scheduleNext(sendCallback);
        }
    }

    private getInterval(): number {
        const remaining = this.twitchApi.rateLimitRemaining;
        if (remaining < 200) return 60000;
        if (remaining < 400) return 30000;
        if (remaining < 600) return 12000;
        return POLLING_INTERVAL;
    }

    private scheduleNext(sendCallback: any): void {
        setTimeout(async () => {
            try {
                const data = await this.dataFormatter.updateAll();
                sendCallback(data);
            } catch (error) {
                throw wrapError("DataPusher.scheduleNext failed", error);
            } finally {
                this.scheduleNext(sendCallback);
            }
        }, this.getInterval());
    }

    async getConfig(): Promise<[number, StreamsInfos][]> {
        await this.readyPromise;
        return this.dataFormatter.getInfotoSend();
    }

}