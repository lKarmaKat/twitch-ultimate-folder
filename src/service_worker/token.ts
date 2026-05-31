import type { Writable } from "svelte/store";
import { wrapError } from "./errors";
import { CLIENT_ID } from "../constantes";

export class TokenManager {
    CLIENT_ID = CLIENT_ID;
    REDIRECT_URI = chrome.identity.getRedirectURL();
    TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
    SCOPE = 'channel:read:subscriptions+user:read:email+user:read:follows';

    token?: string | null;
    refreshToken?: string | null;
    userId?: string;
    tokenExpirationDate = 0;
    fetchingPromise: Promise<string> | null = null;
    tokenValidationInterval = 30 * 60 * 1000;
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

        if (this.isTokenValid()) {
            this.userUpdate?.set(true);
            return this.token!;
        }

        try {
            await this.validateAuthToken();
            this.userUpdate?.set(true);
            return this.token!;
        } catch {
            if (this.refreshToken) {
                try {
                    await this.refreshAccessToken();
                    this.userUpdate?.set(true);
                    return this.token!;
                } catch { /* fall through to new auth */ }
            }
            try {
                await this.getNewTokenAndValidate();
                this.userUpdate?.set(true);
                return this.token!;
            } catch {
                this.userUpdate?.set(false);
                throw new Error("TokenManager.initToken Invalid token and unable to refresh or get a new one.");
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
                if (this.refreshToken) {
                    try {
                        await this.refreshAccessToken();
                        return this.token!;
                    } catch { /* fall through */ }
                }
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

    private generateCodeVerifier(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    private async generateCodeChallenge(verifier: string): Promise<string> {
        const data = new TextEncoder().encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    async chromeStorageToken(): Promise<void> {
        const data = await chrome.storage.local.get([
            'twitchToken', 'tokenExpirationDate', 'nextValidationDate', 'refreshToken'
        ]);
        if (!data.twitchToken) throw new Error('No token in storage');
        this.token = data.twitchToken as string;
        this.tokenExpirationDate = parseInt(data.tokenExpirationDate as string) || 0;
        this.nextValidationDate = parseInt(data.nextValidationDate as string) || 0;
        this.refreshToken = (data.refreshToken as string) ?? null;
    }

    isTokenValid(): boolean {
        if (this.nextValidationDate && this.tokenExpirationDate) {
            return Date.now() < this.nextValidationDate && Date.now() < this.tokenExpirationDate;
        }
        return false;
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

    async getNewAuthToken(manualConnect: boolean = false): Promise<void> {
        if (this.authAutoFailed && !manualConnect) {
            throw new Error('TokenManager.getNewAuthToken auth previously failed non-interactively');
        }

        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);

        const authUrl = `https://id.twitch.tv/oauth2/authorize`
            + `?client_id=${this.CLIENT_ID}`
            + `&response_type=code`
            + `&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}`
            + `&scope=${this.SCOPE}`
            + `&code_challenge=${codeChallenge}`
            + `&code_challenge_method=S256`;

        const redirectUrl = await new Promise<string>((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(
                { url: authUrl, interactive: true },
                (redirectUrl) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError?.message));
                    } else if (!redirectUrl) {
                        reject(new Error("TokenManager.getNewAuthToken No redirect url"));
                    } else {
                        resolve(redirectUrl);
                    }
                }
            );
        });

        const code = new URL(redirectUrl).searchParams.get('code');
        if (!code) {
            this.authAutoFailed = true;
            this.userAuthAutoFailed?.set(true);
            throw new Error('TokenManager.getNewAuthToken No code in redirect URL');
        }

        await this.exchangeCodeForToken(code, codeVerifier);
    }

    private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<void> {
        const body = new URLSearchParams({
            client_id: this.CLIENT_ID,
            code,
            code_verifier: codeVerifier,
            grant_type: 'authorization_code',
            redirect_uri: this.REDIRECT_URI,
        });

        const response = await fetch(this.TOKEN_URL, { method: 'POST', body });
        const data = await response.json();

        if (!data.access_token) {
            throw new Error('TokenManager.exchangeCodeForToken No access_token in response');
        }

        this.token = data.access_token;
        this.refreshToken = data.refresh_token ?? null;
        chrome.storage.local.set({
            twitchToken: this.token,
            ...(this.refreshToken && { refreshToken: this.refreshToken }),
        });
    }

    async refreshAccessToken(): Promise<string> {
        if (!this.refreshToken) throw new Error('TokenManager.refreshAccessToken No refresh token');

        const body = new URLSearchParams({
            client_id: this.CLIENT_ID,
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
        });

        const response = await fetch(this.TOKEN_URL, { method: 'POST', body });
        const data = await response.json();

        if (!data.access_token) {
            this.refreshToken = null;
            chrome.storage.local.remove('refreshToken');
            throw new Error('TokenManager.refreshAccessToken Token refresh failed');
        }

        this.token = data.access_token;
        this.refreshToken = data.refresh_token ?? this.refreshToken;
        this.setTokenExpirationDate(data.expires_in);
        this.nextValidationDate = Date.now() + this.tokenValidationInterval;
        chrome.storage.local.set({
            twitchToken: this.token,
            refreshToken: this.refreshToken,
            tokenExpirationDate: data.expires_in,
            nextValidationDate: this.nextValidationDate,
        });
        return this.token!;
    }

    validateAuthToken(): Promise<void> {
        return new Promise((resolve, reject) => {
            fetch("https://id.twitch.tv/oauth2/validate", {
                method: 'GET',
                headers: { Authorization: 'OAuth ' + this.token }
            }).then(response => {
                return response.json();
            }).then((response) => {
                if (response['status'] === 401) {
                    this.token = null;
                    reject(new Error("TokenManager.validateAuthToken Token validation failed"));
                    return;
                }
                this.userId = response.user_id;
                this.setTokenExpirationDate(response.expires_in);
                this.nextValidationDate = Date.now() + this.tokenValidationInterval;
                chrome.storage.local.set({
                    tokenExpirationDate: response.expires_in,
                    nextValidationDate: this.nextValidationDate,
                });
                resolve();
            });
        });
    }

    setTokenExpirationDate(expires_in: number) {
        this.tokenExpirationDate = Date.now() + (expires_in * 1000);
    }
}
