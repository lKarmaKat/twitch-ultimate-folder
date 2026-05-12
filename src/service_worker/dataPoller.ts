import { wrapError } from './errors';
import type { TwitchApi } from "./twitch";
import type { StreamsInfos } from "./models/streamsInfos.model";
import { DataFormatter } from "./dataFormatter";
import { POLLING_INTERVAL } from '../constantes'


export class DataPoller {
    dataFormatter;

    constructor(twitchApi: TwitchApi, sendCallback: any) {
        this.dataFormatter = new DataFormatter(twitchApi);
        setInterval(async () => {
            try {
                const data = await this.dataFormatter.updateAll();
                sendCallback(data)
            } catch (error) {
                throw wrapError("ConfigPoller.constructor failed", error)
            }
        }, POLLING_INTERVAL);

    }

    async getConfig(): Promise<[number, StreamsInfos][]> {
        return this.dataFormatter.getInfotoSend();
    }

}