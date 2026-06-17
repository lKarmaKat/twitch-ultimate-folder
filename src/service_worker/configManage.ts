import { TwitchApi } from './twitch';
import type { User } from './models/user';
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

        this.userConfigsPromise = (async (): Promise<UserConfigs | null> => {
            const data: { [key: string]: UserConfigs } = await chrome.storage.local.get(String(userId));
            let userStructure: UserConfigs = data[String(userId)];

            if (userStructure && Object.getOwnPropertyNames(userStructure).length > 0) {
                if (!userStructure.currentConfig) {
                    if (userStructure.configsList.length === 0) {
                        userStructure.currentConfig = CST.NEW_LIST.name;
                        userStructure.configsList = [CST.STARTUP_CONF];
                    } else {
                        userStructure.currentConfig = userStructure.configsList[0].rootList.name;
                    }
                }
                this.userConfigs = userStructure;
                return userStructure;
            }

            const startConfig: UserConfigs = {
                ...CST.STARTUP_USER_CONFIGS,
                currentConfig: CST.STARTUP_USER_CONFIGS.configsList[0].rootList.name,
                userId,
            };
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
        const data: { [key: string]: UserConfigs } = await chrome.storage.local.get(String(userId));
        let userStructure: UserConfigs = data[String(userId)];

        if (userStructure) {
            const index = userStructure.configsList.findIndex(
                conf => conf.rootList.name === configToSave.rootList.name
            );
            if (index >= 0) {
                userStructure.configsList[index] = configToSave;
            } else {
                userStructure.configsList.push(configToSave);
            }
            await chrome.storage.local.set({ [String(userId)]: userStructure });
        } else {
            userStructure = {
                userId,
                currentConfig: configToSave.rootList.name,
                configsList: [configToSave]
            };
            await chrome.storage.local.set({ [String(userId)]: userStructure });
        }

        this.userConfigs = userStructure;
        return userStructure;
    }
}


/**
 * Si pas d'utilisateur connecté, on récupère une config par défaut.
 *
 * Si aucun objet userConfig n'est trouvé, il est créé mais pas tout de suite sauvegardé
 * quand un utilisateur se connecte la config global est récupérée et gardée.
 *      Si l'utilisateur change, la popup se ferme et les configs en cours de modifications ne sont pas sauvegardées.
 *
 *
 *
 * l'utilisateur peut créer plusieurs configurations avec un nom.
 * si aucune configuration n'existe, une config par défaut nommée 'défaut' est renvoyée (mais pas encore sauvegardée)
 *      une fois sauvegardée la config par défaut devient la currentConfig (si aucune autre config).
 * si la config n'existe pas en mémoire au moment de la sauvegarde, elle est créée
 * l'utilisateur peut sauvegarder une config spécifique
 * si une config currentConfig est supprimée, la première config de la liste devient la currentConfig
 * le nom de la config actuellement utilisée est stocké dans currentConfig pour être affichée dans la sidebar et par défaut dans la config popup
 *
 * la liste des configs est affichée dans la popup de config
 * un utilisateur peut sélectionner une config comme currentConfig
 *
 *
 *
 * quand un utilisateur modifie une config dans la popup de config, une étoile apparait dans le bloc de la config
 * l'utilisateur peut renommer une config
 *
 *
 *
 *
 */
