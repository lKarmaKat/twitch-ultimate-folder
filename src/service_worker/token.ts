import { logErrorChain, wrapError } from "./errors";
import { CLIENT_ID, tokenKey } from "../constantes";

export interface DeviceCodeInfo {
    user_code: string;
    verification_uri: string;
    device_code: string;
}

/** Contents of the `token_<userId>` key in chrome.storage.local. */
export interface StoredToken {
    twitchToken: string | null;
    refreshToken: string | null;
    tokenExpirationDate: number;
    nextValidationDate: number;
}

/**
 * Handles OAuth tokens for ONE account at a time, persisted per account under
 * `token_<userId>`. Its only outgoing signal is `onAuthLost`.
 */
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
    authInProgressPromise: Promise<void> | null = null;
    currentDeviceCodeInfo: DeviceCodeInfo | null = null;

    /** Set by the background: the current account's token is unrecoverable. */
    onAuthLost?: () => void;

    /**
     * Repoints the manager at `userId` and tries to make its token usable.
     * @returns true if a valid token is available, false if authorization is needed.
     */
    async switchUser(userId: number): Promise<boolean> {
        this.reset();
        this.userId = userId;

        const key = tokenKey(userId);
        const stored = (await chrome.storage.local.get(key))[key] as StoredToken | undefined;
        // A more recent switch happened while reading storage: going on would
        // overwrite its state with this user's.
        if (this.userId !== userId) return false;
        if (!stored?.refreshToken) return false;

        this.token = stored.twitchToken ?? null;
        this.refreshToken = stored.refreshToken;
        this.tokenExpirationDate = stored.tokenExpirationDate ?? 0;
        this.nextValidationDate = stored.nextValidationDate ?? 0;

        try {
            await this.validateAuthToken();
            return this.userId === userId;
        } catch {
            try {
                await this.refreshAccessToken();
                await this.validateAuthToken();
                return this.userId === userId;
            } catch (error) {
                logErrorChain("TokenManager.switchUser", wrapError(
                    `TokenManager.switchUser could not restore a token for ${userId}`, error));
                return false;
            }
        }
    }

    /**
     * Starts the device flow FOR an account, only on an explicit user action.
     * `userId` must be set first: pollForDeviceToken persists before validation.
     */
    async startAuthFor(userId: number, callback: ((info: { user_code: string; verification_uri: string }) => void) | null): Promise<string> {
        if (this.authInProgressPromise && this.userId === userId) {
            // Popup reopened during polling: hook onto the running flow.
            await this.authInProgressPromise;
            return this.token!;
        }

        this.reset();
        this.userId = userId;
        try {
            return await this.getNewTokenAndValidate(callback, userId);
        } catch (error) {
            throw wrapError("TokenManager.startAuthFor failed to obtain a token", error);
        }
    }

    /** Twitch logout: drop the in-memory state, never the storage. */
    clear(): void {
        this.reset();
        this.userId = undefined;
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
                // No fallback to the device flow: authorization only starts on
                // an explicit user action. Report the loss instead.
                if (!this.refreshToken) {
                    this.notifyAuthLost();
                    throw new Error("TokenManager.getToken no refresh token available");
                }
                try {
                    await this.refreshAccessToken();
                    return this.token!;
                } catch (error) {
                    this.notifyAuthLost();
                    throw wrapError("TokenManager.getToken failed to refresh token", error);
                }
            }
        })().finally(() => {
            this.fetchingPromise = null;
        });

        return this.fetchingPromise;
    }

    /**
     * Clears state AND in-flight promises. The latter matter: otherwise a device
     * flow started for account A would write A's token under `token_<B>`.
     */
    private reset(): void {
        this.token = null;
        this.refreshToken = null;
        this.tokenExpirationDate = 0;
        this.nextValidationDate = 0;
        this.fetchingPromise = null;
        this.authInProgressPromise = null;
        this.currentDeviceCodeInfo = null;
    }

    private notifyAuthLost(): void {
        this.token = null;
        this.onAuthLost?.();
    }

    private async persist(): Promise<void> {
        if (!this.userId) return;
        const stored: StoredToken = {
            twitchToken: this.token ?? null,
            refreshToken: this.refreshToken ?? null,
            tokenExpirationDate: this.tokenExpirationDate,
            nextValidationDate: this.nextValidationDate,
        };
        await chrome.storage.local.set({ [tokenKey(this.userId)]: stored });
    }

    private isTokenValid(): boolean {
        if (this.nextValidationDate && this.tokenExpirationDate) {
            return Date.now() < this.nextValidationDate && Date.now() < this.tokenExpirationDate;
        }
        return false;
    }

    private async getNewTokenAndValidate(callback: any, authUserId: number): Promise<string> {
        try {
            await this.getNewAuthToken(callback, authUserId);
            await this.validateAuthToken();
            return this.token!;
        } catch (error) {
            throw wrapError("TokenManager.getNewTokenAndValidate failed to get new token or validate", error);
        }
    }

    private async getNewAuthToken(callback: any, authUserId: number): Promise<void> {
        if (this.authInProgressPromise) return this.authInProgressPromise;

        this.authInProgressPromise = (async () => {
            try {
                const { device_code, user_code, verification_uri, interval, expires_in } = await this.requestDeviceCode();
                this.currentDeviceCodeInfo = {
                    device_code,
                    user_code,
                    verification_uri
                }
                if (callback) callback({ user_code, verification_uri });
                await this.pollForDeviceToken(device_code, interval, Date.now() + expires_in * 1000, authUserId);
            } catch (error) {
                throw wrapError("TokenManager.getNewAuthToken device flow failed", error);
            }
        })().finally(() => {
            this.authInProgressPromise = null;
            // An activation code only exists WHILE it waits to be entered:
            // keeping it would show a spent code forever, success included.
            this.currentDeviceCodeInfo = null;
        });

        return this.authInProgressPromise;
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
        expiresAt: number,
        authUserId: number
    ): Promise<void> {
        const body = new URLSearchParams({
            client_id: CLIENT_ID,
            device_code,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            scopes: this.SCOPE
        });

        while (Date.now() < expiresAt) {
            await new Promise(r => setTimeout(r, interval * 1000));
            const response = await fetch(this.TOKEN_URL, { method: 'POST', body });
            const data = await response.json();

            if (data.access_token) {
                // Polling lasts tens of seconds, so the account may have changed.
                // reset() drops the promise, but this loop keeps running.
                if (this.userId !== authUserId) {
                    throw new Error(
                        `TokenManager.pollForDeviceToken user switched away from ${authUserId} during authorization`);
                }
                this.token = data.access_token;
                this.refreshToken = data.refresh_token ?? null;
                this.setTokenExpirationDate(data.expires_in);
                await this.persist();
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
        const validatedUserId = Number(data.user_id);

        // Bucket `token_<X>` must hold a token that really belongs to X, or a
        // corrupted bucket would serve one account's channels under another's.
        if (this.userId !== undefined && validatedUserId !== this.userId) {
            this.token = null;
            throw new Error(
                `TokenManager.validateAuthToken token belongs to ${validatedUserId}, expected ${this.userId}`);
        }

        this.userId = validatedUserId;
        this.setTokenExpirationDate(data.expires_in);
        await this.persist();
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
            await this.persist();
            throw new Error('TokenManager.refreshAccessToken Token refresh failed');
        }

        this.token = data.access_token;
        this.refreshToken = data.refresh_token ?? this.refreshToken;
        this.setTokenExpirationDate(data.expires_in);
        await this.persist();
        return this.token!;
    }

    private setTokenExpirationDate(expires_in: number) {
        this.tokenExpirationDate = Date.now() + (expires_in * 1000);
        this.nextValidationDate = Date.now() + this.tokenValidationInterval;
    }
}
