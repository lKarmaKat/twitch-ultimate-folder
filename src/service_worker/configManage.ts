import { TwitchApi } from './twitch';
import type { UserConfigs, I_NEW_LIST, I_CONFIG } from './models/userStructure'
// import type { Writable } from "svelte/store";
import * as CST from '../constantes'

export class ConfigManager {
    twitchApi: TwitchApi;
    userId: number | null = null;
    userConfigs: UserConfigs | null = null;
    userConfigsPromise: Promise<UserConfigs | null> | null = null;

    constructor(twitchApi: TwitchApi
        // , userUpdate: Writable<boolean>
    ) {
        this.twitchApi = twitchApi;
        // userUpdate.subscribe((userValid: boolean) => {
        //     if (!userValid) {
        //         this.user = null;
        //         this.userConfigs = null;
        //     } else {
        //         const userId = this.twitchApi.tokenManager.userId;
        //         if (!userId) return;
        //         this.user = { id: Number(userId), login: '', display_name: '' };
        //         this.getConfigObjectForCurrentUser();
        //     }
        // });
    }

    initConfigWithUser(userId: number) {
        this.userId = userId;
    }

    getConfigObjectForCurrentUser(): Promise<UserConfigs | null> {
        if (!this.userId) return Promise.resolve(null);
        if (this.userConfigsPromise) return this.userConfigsPromise;

        const userId = this.userId;
        const key = CST.configKey(userId);
        this.userConfigsPromise = (async (): Promise<UserConfigs | null> => {
            const data: { [key: string]: UserConfigs } = await chrome.storage.local.get(key);
            let userStructure: UserConfigs = data[key];
            if (userStructure && Object.getOwnPropertyNames(userStructure).length > 0) {
                if (!userStructure.currentConfig) {
                    if (userStructure.configsList.length === 0) {
                        userStructure.currentConfig = CST.NEW_LIST.name;
                        userStructure.configsList = [CST.createStartupConf()];
                    } else {
                        userStructure.currentConfig = userStructure.configsList[0].rootList.name;
                    }
                }
                this.userConfigs = userStructure;
                return userStructure;
            }
            
            const startConfig: UserConfigs = CST.createStartupUserConfigs(userId);
            startConfig.currentConfig = startConfig.configsList[0].rootList.name;
            this.userConfigs = startConfig;
            return startConfig;
        })().finally(() => {
            this.userConfigsPromise = null;
        });

        return this.userConfigsPromise;
    }

    findConfigById(configName: string): I_NEW_LIST | null {
        if (this.userId) {
            const config = this.userConfigs!.configsList.find(conf => conf.rootList.name === configName);
            if (config?.config)
                return config.config;
        }
        return null;
    }

    async saveConfig(configToSave: I_CONFIG): Promise<UserConfigs> {
        if (!configToSave) throw new Error("No config to save");
        if (!this.userId) throw new Error("No user connected, cannot save config");

        const userId = this.userId;
        // Dedicated config key; tokens live under `token_<userId>`. A shared
        // object would lose the refreshed token in the read-modify-write below.
        const key = CST.configKey(userId);
        const data: { [key: string]: UserConfigs } = await chrome.storage.local.get(key);
        let userStructure: UserConfigs = data[key];

        if (userStructure) {
            const index = userStructure.configsList.findIndex(
                conf => conf.rootList.name === configToSave.rootList.name
            );
            if (index >= 0) {
                userStructure.configsList[index] = configToSave;
            } else {
                userStructure.configsList.push(configToSave);
            }
            await chrome.storage.local.set({ [key]: userStructure });
        } else {
            userStructure = {
                userId,
                currentConfig: configToSave.rootList.name,
                configsList: [configToSave]
            };
            await chrome.storage.local.set({ [key]: userStructure });
        }

        this.userConfigs = userStructure;
        return userStructure;
    }
}


/**
 * Users can hold several named configs; a missing one yields a 'default' that
 * is only persisted on save, and `currentConfig` names the one in use.
 */
