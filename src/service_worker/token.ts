import type { Writable } from "svelte/store";
import { wrapError } from "./errors";
import { CLIENT_ID } from "../constantes";

export class TokenManager {
    CLIENT_ID = CLIENT_ID;
    REDIRECT_URI = chrome.identity.getRedirectURL();
    AUTH_URL = `https://id.twitch.tv/oauth2/authorize?client_id=${this.CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&scope=channel:read:subscriptions+user:read:email+user:read:follows`;

    token?: string | null;
    tokenExpirationDate = 0;
    fetchingPromise: Promise<string> | null = null;
    tokenValidationInterval = 30 * 60 * 1000; // check validity every 30 minutes.
    nextValidationDate = 0;
    authAutoFailed = false;
    userUpdate?: Writable<boolean>;
    userAuthAutoFailed?: Writable<boolean>;


    constructor(userUpdate?: Writable<boolean>, userAuthAutoFailed?: Writable<boolean>) {
        this.userUpdate = userUpdate;
        this.userAuthAutoFailed = userAuthAutoFailed;
    }

    async initToken(): Promise<string> {
        try {
            await this.chromeStorageToken();
        } catch {
            try {
                await this.getNewTokenAndValidate();
                this.userUpdate?.set(true);
                return this.token!;
            } catch {
                this.userUpdate?.set(false);
                throw new Error("TokenManager.initToken No token found and unable to get a new one.");
            }
        }

        try {
            await this.validateAuthToken();
            this.userUpdate?.set(true);
            return this.token!;
        } catch {
            try {
                await this.getNewTokenAndValidate();
                this.userUpdate?.set(true);
                return this.token!;
            } catch {
                this.userUpdate?.set(false);
                throw new Error("TokenManager.initToken Invalid token found but unable to get a new one.");
            }
        }
    }
    
    
    getToken(): Promise<string> {
        if (this.isTokenValid()) {
            return Promise.resolve(this.token!);
        }

        if (this.fetchingPromise) return this.fetchingPromise;

        this.fetchingPromise = (async () => {
            try {
                await this.validateAuthToken();
                return this.token!;
            } catch {
                try {
                    await this.getNewTokenAndValidate();
                    return this.token!;
                } catch (error) {
                    this.userUpdate?.set(false);
                    throw wrapError("TokenManager.getToken failed to refresh token", error);
                }
            }
        })().finally(() => {
            this.fetchingPromise = null;
        });

        return this.fetchingPromise;
    }

    
    getFromStorage(key: any): Promise<string> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(key, (data: Partial<string>) => {
                if (data[key]) {
                    resolve(data[key]);
                } else {
                    reject();
                }
            });
        });
    }

    chromeStorageToken() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.getFromStorage('twitchToken'),
                this.getFromStorage('tokenExpirationDate'),
                this.getFromStorage('nextValidationDate')
            ])
            .then((fulfillments: string[]) => {
                const [twitchToken, tokenExpirationDate, nextValidationDate] = fulfillments;
                this.token = twitchToken;
                this.tokenExpirationDate = parseInt(tokenExpirationDate);
                this.nextValidationDate = parseInt(nextValidationDate);

                resolve(true);
            })
            .catch(() => {
                 reject()
            });
        })
    }

    isTokenValid() {
        if (this.nextValidationDate && this.tokenExpirationDate) {
            return Date.now() < this.nextValidationDate && Date.now() < this.tokenExpirationDate;
        }
        return false
    }

    async getNewTokenAndValidate(): Promise<string> {

        try {
            await this.getNewAuthToken();
            await this.validateAuthToken();
            return this.token!;
        } catch (error) {
            throw wrapError("TokenManager.getNewTokenAndValidate validation failed", error);
        }
    }

    getNewAuthToken(manualConnect: boolean = false) {
        if (this.authAutoFailed && !manualConnect) return Promise.reject();
        return new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(
                { url: this.AUTH_URL, interactive: true },
                (redirectUrl) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError?.message));
                    } else if (!redirectUrl) {
                        reject(new Error("TokenManager.getNewAuthToken No redirect url, no token found"));
                    } 
                    const tokenMatch = redirectUrl!.match(/access_token=([^&]+)/);
                    if (tokenMatch && tokenMatch[1]) {
                        chrome.storage.local.set({ twitchToken: tokenMatch[1] });
                        this.token = tokenMatch[1];
                        resolve(this.token);
                    } else {
                        this.authAutoFailed = true;
                        this.userAuthAutoFailed?.set(true);
                        reject(new Error('TokenManager.getNewAuthToken No token found in WebAuthFlow response'));
                    }
                }
            );
        });
    }

    validateAuthToken() {
        return new Promise((resolve, reject) => {
            fetch("https://id.twitch.tv/oauth2/validate", {
            method: 'GET',
            headers: {Authorization: 'OAuth ' + this.token}
            }).then(response => {
                return response.json();
            }).then((response) => {
                if (response['status'] === 401) {
                    this.token = null;
                    reject(new Error("TokenManager.validateAuthToken Token validation failed"));
                }
                chrome.storage.local.set({ tokenExpirationDate: response.expires_in });
                this.setTokenExpirationDate(response.expires_in);
                this.nextValidationDate = Date.now() + this.tokenValidationInterval;
                chrome.storage.local.set({ nextValidationDate: this.nextValidationDate});
                resolve(response);
            })
        });
    }

    
    setTokenExpirationDate(expires_in: number) {
        this.tokenExpirationDate = Date.now() + (expires_in * 1000);
    }

}

// export default TokenManager;
