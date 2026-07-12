import { wrapError } from "./errors";
import { CLIENT_ID } from "../constantes";

export interface DeviceCodeInfo {
    user_code: string;
    verification_uri: string;
    device_code: string;
}

export class TokenManager {
    TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
    DEVICE_URL = 'https://id.twitch.tv/oauth2/device';
    SCOPE = 'channel:read:subscriptions user:read:email user:read:follows';

    token?: string | null;
    refreshToken?: string | null;
    userId?: number;
    tokenExpirationDate = 0;
    fetchingPromise: Promise<string> | null = null;
    tokenValidationInterval = 30 * 60 * 1000;
    nextValidationDate = 0;
    // authAutoFailed = false;
    authInProgressPromise: Promise<void> | null;
    currentDeviceCodeInfo: DeviceCodeInfo | null;
    userAlreadyLoggedInCallbak: (info: number) => void;
    userGotDisconnected: (data: boolean | null) => void;
    noTokenFound: () => boolean

    constructor(
        userAlreadyLoggedInCallbak: (userId: number) => void,
        userGotDisconnected: (info: boolean | null) => void,
        noTokenFound: () => boolean
    ) {
        console.log("TOKEN CONSTR")
        this.userAlreadyLoggedInCallbak = userAlreadyLoggedInCallbak
        this.userGotDisconnected = userGotDisconnected
        this.noTokenFound = noTokenFound
    }

    async getTokenFromStorage() {
        console.log("getTokenFromStorage")

        try {
            await this.chromeStorageToken();
            try {
                await this.validateAuthToken();
            } catch (error) {
                if (!this.refreshToken) {
                    throw wrapError("TokenManager.getTokenFromStorage no refresh token", error);
                }
                await this.refreshAccessToken();
                await this.validateAuthToken();
            }
            console.log("Calling userAlreadyLoggedInCallbak")
            this.userAlreadyLoggedInCallbak(this.userId!);
        } catch (error) {
            throw wrapError("TokenManager.getTokenFromStorage either refreshing or validating after refresh failed.", error);
        }
        return null;
    }


    async initAuthentification(callback: any): Promise<string> {
        try {
            await this.getNewTokenAndValidate(callback);
            // this.userDisconnected(true);
            if (this.token) {
                this.userAlreadyLoggedInCallbak(this.userId!)
            }
            return this.token!;
        } catch (error) {
            // this.userDisconnected(false);
            throw wrapError("TokenManager.initToken No token found and unable to get a new one.", error);
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
                if (this.refreshToken) {
                    try {
                        await this.refreshAccessToken();
                        return this.token!;
                    } catch (error) {
                        throw wrapError("TokenManager.getToken failed to refresh token", error);
                    }
                }
                try {
                    await this.getNewTokenAndValidate(null);
                    return this.token!;
                } catch (error) {
                    // this.userDisconnected(false);
                    throw wrapError("TokenManager.getToken failed to get new token or validate", error);
                }
            }
        })().finally(() => {
            this.fetchingPromise = null;
        });

        return this.fetchingPromise;
    }

    private async chromeStorageToken(): Promise<void> {
        const data = await chrome.storage.local.get([
            'twitchToken', 'tokenExpirationDate', 'nextValidationDate', 'refreshToken'
        ]);
        if (!data.twitchToken || !data.tokenExpirationDate || !data.nextValidationDate || !data.refreshToken) {
            console.log('Something missing in storage', data.twitchToken, data.tokenExpirationDate, data.nextValidationDate, data.refreshToken);
        }
        if (!data.refreshToken) {
            this.noTokenFound();
            return Promise.reject("Something missing to validate token");
        }
        this.token = data.twitchToken as string;
        this.tokenExpirationDate = parseInt(data.tokenExpirationDate as string) || 0;
        this.nextValidationDate = parseInt(data.nextValidationDate as string) || 0;
        this.refreshToken = (data.refreshToken as string) ?? null;
        if (!this.refreshToken) {
            console.error("No refresh token found in chromeLocalStorage")
        }
    }

    private isTokenValid(): boolean {
        if (this.nextValidationDate && this.tokenExpirationDate) {
            return Date.now() < this.nextValidationDate && Date.now() < this.tokenExpirationDate;
        }
        return false;
    }

    private async getNewTokenAndValidate(callback: any): Promise<string> {
        try {
            await this.getNewAuthToken(callback);
            await this.validateAuthToken();
            return this.token!;
        } catch (error) {
            throw wrapError("TokenManager.getNewTokenAndValidate failed to get new token or validate", error);
        }
    }

    private async getNewAuthToken(callback: any): Promise<void> {
        // if (this.authAutoFailed) {
        //     throw new Error('TokenManager.getNewAuthToken auth previously failed');
        // }
        if (this.authInProgressPromise) return this.authInProgressPromise;

        // if (this.authInProgressPromise) {
        //     if (callback) callback({ 
        //         user_code: this.currentDeviceCodeInfo?.user_code,
        //         verification_uri: this.currentDeviceCodeInfo?.verification_uri
        //     });
        //     return Promise.reject();
        // };

        this.authInProgressPromise = (async () => {
            try {
                const { device_code, user_code, verification_uri, interval, expires_in } = await this.requestDeviceCode();
                this.currentDeviceCodeInfo = {
                    device_code,
                    user_code,
                    verification_uri
                }
                if (callback) callback({ user_code, verification_uri });
                await this.pollForDeviceToken(device_code, interval, Date.now() + expires_in * 1000);
            } catch (error) {
                // this.authAutoFailed = true;
                throw wrapError("error", error);
            }
        })().finally(() => {
            this.authInProgressPromise = null;
        });

        return this.authInProgressPromise;



        // try {
        //     const { device_code, user_code, verification_uri, interval, expires_in } = await this.requestDeviceCode();
        //     if (callback)
        //         callback({user_code, verification_uri});

        //     await this.pollForDeviceToken(device_code, interval, Date.now() + expires_in * 1000);

        //     // this.onAuthSuccess(null);
        // } catch (error) {
        //     // this.authAutoFailed = true;
        //     // this.onAuthSuccess(false);
        // throw wrapError("error", error);
        // }
    }

    private async requestDeviceCode(): Promise<{
        device_code: string;
        user_code: string;
        verification_uri: string;
        interval: number;
        expires_in: number;
    }> {
        const body = new URLSearchParams({
            client_id: CLIENT_ID,
            scopes: this.SCOPE,
        });
        const response = await fetch(this.DEVICE_URL, { method: 'POST', body });
        if (!response.ok) throw new Error(`TokenManager.requestDeviceCode failed: ${response.status}`);
        return response.json();
    }

    private async pollForDeviceToken(
        device_code: string,
        interval: number,
        expiresAt: number
    ): Promise<void> {
        const body = new URLSearchParams({
            client_id: CLIENT_ID,
            device_code,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            scopes: this.SCOPE
        });

        while (Date.now() < expiresAt) {
            console.log("Polling with device_code", device_code)
            await new Promise(r => setTimeout(r, interval * 1000));
            const response = await fetch(this.TOKEN_URL, { method: 'POST', body });
            const data = await response.json();

            if (data.access_token) {
                this.token = data.access_token;
                this.refreshToken = data.refresh_token ?? null;
                this.setTokenExpirationDate(data.expires_in);
                chrome.storage.local.set({
                    twitchToken: this.token,
                    ...(this.refreshToken && { refreshToken: this.refreshToken }),
                    tokenExpirationDate: this.tokenExpirationDate,
                    nextValidationDate: this.nextValidationDate,
                });
                return;
            }
            if (data.message === 'slow_down') interval += 5;
            else if (data.message !== 'authorization_pending') {
                throw new Error(`TokenManager.pollForDeviceToken error: ${data.message}`);
            }
        }
        throw new Error('TokenManager.pollForDeviceToken token expired before user authorized');
    }

    private async validateAuthToken(): Promise<void> {
        const response = await fetch("https://id.twitch.tv/oauth2/validate", {
            method: 'GET',
            headers: { Authorization: 'OAuth ' + this.token }
        });
        if (!response.ok) {
            this.token = null;
            throw new Error("TokenManager.validateAuthToken Token validation failed");
        }
        const data = await response.json();
        this.userId = data.user_id;
        this.setTokenExpirationDate(data.expires_in);
        chrome.storage.local.set({
            tokenExpirationDate: this.tokenExpirationDate,
            nextValidationDate: this.nextValidationDate,
        });
    }

    private async refreshAccessToken(): Promise<string> {
        if (!this.refreshToken) throw new Error('TokenManager.refreshAccessToken No refresh token');

        const body = new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
        });

        const response = await fetch(this.TOKEN_URL, { method: 'POST', body });
        const data = await response.json();

        if (!response.ok || !data.access_token) {
            this.refreshToken = null;
            chrome.storage.local.remove('refreshToken');
            throw new Error('TokenManager.refreshAccessToken Token refresh failed' + JSON.stringify(response));
        }

        this.token = data.access_token;
        this.refreshToken = data.refresh_token ?? this.refreshToken;
        this.setTokenExpirationDate(data.expires_in);
        chrome.storage.local.set({
            twitchToken: this.token,
            refreshToken: this.refreshToken,
            tokenExpirationDate: this.tokenExpirationDate,
            nextValidationDate: this.nextValidationDate,
        });
        return this.token!;
    }

    private setTokenExpirationDate(expires_in: number) {
        this.tokenExpirationDate = Date.now() + (expires_in * 1000);
        this.nextValidationDate = Date.now() + this.tokenValidationInterval;
    }
}
