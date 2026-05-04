import { wrapError } from './errors';
import type { TwitchApi } from "./twitch";
import type { StreamsInfos } from "./models/streamsInfos.model";
import { DataFormatter } from "./dataFormatter";


export class ConfigPoller {
    pollingInterval = 6000;
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
        }, this.pollingInterval);

    }

    async getConfig(): Promise<StreamsInfos[]> {
        return Array.from(this.dataFormatter.allFollowedStreams.values());
    }

}