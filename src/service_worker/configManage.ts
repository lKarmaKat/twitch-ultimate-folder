import { TwitchApi } from './twitch';
import type { User } from './models/user';
import type { UserConfigs, I_NEW_LIST, I_CONFIG } from './models/userStructure'
import type { Writable } from "svelte/store";
import * as CST from '../constantes'

export class ConfigManager {
    twitchApi: TwitchApi;
    user: User | null;
    userConfigs: UserConfigs | null;
    userConfigsPromise: Promise<UserConfigs> | null;

    constructor(twitchApi: TwitchApi, userUpdate: Writable<boolean>) {
        this.twitchApi = twitchApi;
        userUpdate.subscribe((userValid: boolean) => {
            if (!userValid) {
                this.user = null;
                this.userConfigs = null
            } else {
                console.log("User authed");
                this.getCurrentUserInfo().then((user: User) => {
                    if (user)
                        this.getConfigObjectForCurrentUser();
                    else
                        throw new Error("No user -> no config")
                });
            }
        });
        // this.getCurrentUserInfo();
    }


    // getConfigObjectForCurrentUser() {

    // }

    getConfigObjectForCurrentUser(): Promise<UserConfigs> {
        if (this.userConfigsPromise) return this.userConfigsPromise;
        // if (this.userConfigs) return new Promise((resolve) => resolve(this.userConfigs!));

        this.userConfigsPromise = new Promise<UserConfigs>((resolve, reject) => {
            if (!this.user) {
                // Get current config for default user
            }
            chrome.storage.local.get(String(this.user!.id), (data: { [key: string]: UserConfigs }) => {
                let userStructure: any = data[String(this.user!.id)];
                if (userStructure) {
                    this.userConfigs = userStructure;
                }
                if (this.userConfigs) {
                    if (!this.userConfigs.currentConfig) {
                        if (this.userConfigs.configsList.length === 0) {
                            console.log(`No config list for  ${this.user} adding default`);
                            this.userConfigs.currentConfig = CST.NEW_LIST.name;
                            this.userConfigs.configsList = [
                                CST.STARTUP_CONF
                            ]
                        } else {
                            console.log(`No config found without current config ${this.user} `);
                            this.userConfigs.currentConfig = this.userConfigs.configsList[0].rootList.name;
                        }
                    }
                    resolve(this.userConfigs);
                } else {
                    console.log(`No config found for ${this.user} returning startup config`)
                    let startConfig = CST.STARTUP_USER_CONFIGS;
                    startConfig.userId = this.user!.id;
                    resolve(CST.STARTUP_USER_CONFIGS);
                }
                reject(new Error("This shouldn't even be possibe"));
            });
            // resolve(CST.STARTUP_USER_CONFIGS);
        }).finally(() => this.userConfigsPromise = null);
        return this.userConfigsPromise;
    }

    findConfigById(configName: string): I_NEW_LIST | null {
        // TODO si config pas trouvé renvoyer default config
        if (this.user) {
            let config = this.userConfigs!.configsList.find(conf => conf.rootList.name === configName);
            if (config?.config)
                return config.config;
        }
        return null;
    }

    saveConfig(configToSave: I_CONFIG) {
        if (!this.user)
            throw new Error("Unable to save namedConfig reason: no user found");

        chrome.storage.local.get(String(this.user!.id), (userContent: { [key: string]: UserConfigs }) => {
            let userStructure: UserConfigs = userContent[this.user!.id];
            if (userStructure) {
                let index = userStructure.configsList.findIndex(conf => conf.rootList.name === configToSave.rootList.name);
                if (index >= 0) {
                    userStructure.configsList[index] = configToSave;
                } else {
                    userStructure.configsList.push(configToSave);
                }
                console.log("Saving config in existing config struc", userStructure);
                chrome.storage.local.set(userContent);
            } else {
                // const id = this.user!.id;
                let c: any = {};
                c[this.user!.id] = {
                    userId: this.user!.id, 
                    currentConfig: 'default',
                    configsList: [ configToSave ]
                }
                console.log("Saving new configObject", c);
                chrome.storage.local.set(c)
            }
        });
    }
    /**
     * 
     * {
        "data": [
            {
                "id": "217921932",
                "login": "karmakat__",
                "display_name": "KarmaKat__",
                "type": "",
                "broadcaster_type": "",
                "description": "",
                "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/0742689c-1685-4eb6-9b2e-386d251dba7b-profile_image-300x300.png",
                "offline_image_url": "",
                "view_count": 0,
                "email": "lloydwestbury@gmail.com",
                "created_at": "2018-05-01T14:46:07Z"
            }
        ]
    }
        */
    getCurrentUserInfo(): Promise<User> {
        return this.twitchApi.getUserInfo().then(user => {
            if (user) {    
                this.user = user;
                return this.user;
            }
            throw new Error("User not found"); // Default here remove.
        })
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
 * si une config est demandée et qu'elle n'est pas trouvée, un message d'erreur est envoyé (port spécifique ?)
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