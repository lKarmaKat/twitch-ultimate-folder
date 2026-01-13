import type { Writable } from "svelte/store";

export class TokenManager {
    CLIENT_ID = '0cccietj726skd2jwlf39ymhmyzbi7';
    REDIRECT_URI = chrome.identity.getRedirectURL();
    AUTH_URL = `https://id.twitch.tv/oauth2/authorize?client_id=${this.CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&scope=channel:read:subscriptions+user:read:email+user:read:follows`;

    token?: string | null;
    tokenExpirationDate = 0;
    fetchingPromise: Promise<string> | null = null;
    tokenValidationInterval = 30 * 60 * 1000; // check validity every 30 minutes.
    nextValidationDate = 0;
    userUpdate: Writable<boolean>;
    userAuthAutoFailed: Writable<boolean>;


    constructor(userUpdate: Writable<boolean>, userAuthAutoFailed: Writable<boolean>) {
        this.userUpdate = userUpdate;
        this.userAuthAutoFailed = userAuthAutoFailed;
    }

    initToken() {
        return new Promise((resolve, reject) => {
            this.chromeStorageToken()
            .then(() => {
                if (this.isTokenValid()) {
                    this.userUpdate.set(true);
                    resolve(this.token);
                }
                this.validateAuthToken()
                .then((token) => {
                    this.userUpdate.set(true);
                    resolve(token);
                }).catch(() => {
                    this.getNewTokenAndValidate()
                    .then((token) => {
                        this.userUpdate.set(true);
                        resolve(token);
                    })
                    .catch(() => {
                        this.userUpdate.set(false);
                        reject(new Error("Invalid token found but unable to get a new one."))
                    });
                });
            }).catch(() => {
                this.getNewTokenAndValidate()
                .then((token) => {
                    this.userUpdate.set(true);
                    resolve(token)
                })
                .catch(() => {
                    this.userUpdate.set(false);
                    reject(new Error("No token found and unable to get a new one."))
                });
            })
        })
        .catch((error) => {
            throw new Error(error);
        });
    }
    
    
    getToken(): Promise<string> {
        if (this.isTokenValid()) {
            return new Promise(resolve => resolve(this.token!));
        }
        if (this.fetchingPromise) return this.fetchingPromise;
        this.fetchingPromise =  new Promise<string>((resolve, reject) => {
            this.validateAuthToken()
            .then(() => resolve(this.token!))
            .catch(() => {
                this.getNewTokenAndValidate().then(() => {
                    resolve(this.token!)
                }).catch((err) => {
                    this.userUpdate.set(false);
                    reject(new Error("GetToken unable to get new token"));
                });

            })
        }).finally(() => {
            this.fetchingPromise = null
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

    getNewTokenAndValidate() {
        return this.getNewAuthToken()
        .then(() => {
            return this.validateAuthToken()
            .then(() => {
            })
            .catch(() => {
                throw new Error("Token validation error")
            });
        });
    }

    getNewAuthToken(manualConnect: boolean = false) {
        if (this.userAuthAutoFailed && !manualConnect) return Promise.reject();
        return new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(
                { url: this.AUTH_URL, interactive: true },
                (redirectUrl) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError?.message));
                    } else if (!redirectUrl) {
                        reject(new Error("No redirect url, no token found"));
                    } 
                    const tokenMatch = redirectUrl!.match(/access_token=([^&]+)/);
                    if (tokenMatch && tokenMatch[1]) {
                        chrome.storage.local.set({ twitchToken: tokenMatch[1] });
                        this.token = tokenMatch[1];
                        resolve(this.token);
                    } else {
                        this.userAuthAutoFailed.set(true);
                        reject(new Error('No token found in WebAuthFlow response'));
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
                    reject(new Error("Token validation failed"));
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