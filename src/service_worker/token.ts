import { AuthRevokedError, TransientAuthError, findCause, logErrorChain, wrapError } from "./errors";
import { CLIENT_ID, tokenKey } from "../constantes";
import { api } from "../browserApi";

/** id.twitch.tv's own trouble, never a verdict on the token. */
function isTransientStatus(status: number): boolean {
    return status === 429 || status >= 500;
}

const REJECTED_GRANT = /invalid[_ ]?(grant|refresh[_ ]?token)|unauthorized|revoked/i;

/**
 * Only a 400/401 naming the grant is permanent: Twitch answers 400 for a
 * malformed request too, and an unreadable body proves nothing.
 */
export function isRefreshTokenRejected(status: number, body: unknown): boolean {
    if (status !== 400 && status !== 401) return false;
    const data = (body ?? {}) as { message?: unknown; error?: unknown; error_description?: unknown };
    const detail = [data.message, data.error, data.error_description]
        .filter((part): part is string => typeof part === 'string')
        .join(' ');
    return REJECTED_GRANT.test(detail);
}

export interface DeviceCodeInfo {
    user_code: string;
    verification_uri: string;
    device_code: string;
}

/** Contents of the `token_<userId>` key in storage.local. */
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
    SCOPE = 'user:read:follows';

    token?: string | null;
    refreshToken?: string | null;
    userId?: number;
    tokenExpirationDate = 0;
    fetchingPromise: Promise<string> | null = null;
    tokenValidationInterval = 30 * 60 * 1000;
    nextValidationDate = 0;
    authInProgressPromise: Promise<void> | null = null;
    currentDeviceCodeInfo: DeviceCodeInfo | null = null;
    switchPromise: Promise<boolean> | null = null;
    private switchingUserId?: number;
    private refreshingPromise: Promise<string> | null = null;
    private refreshingEpoch = -1;
    // Bumped by every account change and every new authorization: a write from a
    // superseded operation is dropped instead of overwriting live state.
    private switchEpoch = 0;

    /** Set by the background: the current account's token is unrecoverable. */
    onAuthLost?: () => void;

    /**
     * Repoints the manager at `userId` and tries to make its token usable.
     * @returns true if a valid token is available, false if authorization is needed.
     */
    switchUser(userId: number): Promise<boolean> {
        // Every Twitch tab reports the same session after a worker wake: the
        // duplicates await the running switch instead of resetting its state.
        if (this.switchPromise && this.switchingUserId === userId) return this.switchPromise;

        const epoch = this.beginNewOperation();
        this.switchingUserId = userId;
        this.switchPromise = this.restoreUser(userId, epoch).finally(() => {
            if (epoch !== this.switchEpoch) return;
            this.switchPromise = null;
            this.switchingUserId = undefined;
        });
        return this.switchPromise;
    }

    private async restoreUser(userId: number, epoch: number): Promise<boolean> {
        this.reset();
        this.userId = userId;

        const key = tokenKey(userId);
        const stored = (await api.storage.local.get(key))[key] as StoredToken | undefined;
        // A more recent operation took over while reading storage: going on would
        // overwrite its state with this user's.
        if (epoch !== this.switchEpoch) return false;
        if (!stored?.refreshToken) return false;

        this.token = stored.twitchToken ?? null;
        this.refreshToken = stored.refreshToken;
        this.tokenExpirationDate = stored.tokenExpirationDate ?? 0;
        this.nextValidationDate = stored.nextValidationDate ?? 0;

        try {
            await this.validateAuthToken(epoch);
            return epoch === this.switchEpoch;
        } catch {
            try {
                await this.refreshAccessToken(epoch);
                await this.validateAuthToken(epoch);
                return epoch === this.switchEpoch;
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

        const epoch = this.beginNewOperation();
        this.reset();
        this.userId = userId;
        try {
            return await this.getNewTokenAndValidate(callback, userId, epoch);
        } catch (error) {
            throw wrapError("TokenManager.startAuthFor failed to obtain a token", error);
        }
    }

    /** Twitch logout: drop the in-memory state, never the storage. */
    clear(): void {
        this.beginNewOperation();
        this.reset();
        this.userId = undefined;
    }

    /**
     * Helix rejected the token before its 30-min window elapsed: force the next
     * getToken through validation instead of trusting nextValidationDate.
     */
    invalidateToken(): void {
        this.nextValidationDate = 0;
    }

    getToken(): Promise<string> {
        if (this.isTokenValid()) {
            return Promise.resolve(this.token!);
        }

        if (this.fetchingPromise) return this.fetchingPromise;

        const epoch = this.switchEpoch;
        this.fetchingPromise = (async () => {
            try {
                await this.validateAuthToken(epoch);
                return this.token!;
            } catch (validationError) {
                // No fallback to the device flow: authorization only starts on
                // an explicit user action. Report the loss instead.
                if (!this.refreshToken) {
                    if (findCause(validationError, AuthRevokedError)) this.notifyAuthLost();
                    throw wrapError("TokenManager.getToken no refresh token available", validationError);
                }
                try {
                    await this.refreshAccessToken(epoch);
                    return this.token!;
                } catch (error) {
                    // Only a rejected grant is unrecoverable: network and 5xx must
                    // be retried, not answered with a re-auth prompt.
                    if (findCause(error, AuthRevokedError)) this.notifyAuthLost();
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

    /**
     * Invalidates in-flight operations: their writes and their coalescing slots
     * describe a state that no longer exists.
     */
    private beginNewOperation(): number {
        this.switchPromise = null;
        this.switchingUserId = undefined;
        return ++this.switchEpoch;
    }

    /**
     * `authoritative` is the ONLY way a null refreshToken reaches storage: a
     * fresh grant, or a grant Twitch rejected. Every other path refuses.
     */
    private async persist(epoch: number, authoritative = false): Promise<void> {
        if (!this.userId) return;
        if (epoch !== this.switchEpoch) return;
        if (!this.refreshToken && !authoritative) return;

        const stored: StoredToken = {
            twitchToken: this.token ?? null,
            refreshToken: this.refreshToken ?? null,
            tokenExpirationDate: this.tokenExpirationDate,
            nextValidationDate: this.nextValidationDate,
        };
        await api.storage.local.set({ [tokenKey(this.userId)]: stored });
    }

    private isTokenValid(): boolean {
        // A blanked bucket can still carry a future nextValidationDate, which
        // would otherwise hand a null token to TwitchApi.
        if (!this.token) return false;
        if (this.nextValidationDate && this.tokenExpirationDate) {
            return Date.now() < this.nextValidationDate && Date.now() < this.tokenExpirationDate;
        }
        return false;
    }

    private async getNewTokenAndValidate(callback: any, authUserId: number, epoch: number): Promise<string> {
        try {
            await this.getNewAuthToken(callback, authUserId, epoch);
            await this.validateAuthToken(epoch);
            return this.token!;
        } catch (error) {
            throw wrapError("TokenManager.getNewTokenAndValidate failed to get new token or validate", error);
        }
    }

    private async getNewAuthToken(callback: any, authUserId: number, epoch: number): Promise<void> {
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
                await this.pollForDeviceToken(device_code, interval, Date.now() + expires_in * 1000, authUserId, epoch);
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
        authUserId: number,
        epoch: number
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
                if (this.userId !== authUserId || epoch !== this.switchEpoch) {
                    throw new Error(
                        `TokenManager.pollForDeviceToken user switched away from ${authUserId} during authorization`);
                }
                this.token = data.access_token;
                this.refreshToken = data.refresh_token ?? null;
                this.setTokenExpirationDate(data.expires_in);
                await this.persist(epoch, true);
                return;
            }
            if (data.message === 'slow_down') interval += 5;
            else if (data.message !== 'authorization_pending') {
                throw new Error(`TokenManager.pollForDeviceToken error: ${data.message}`);
            }
        }
        throw new Error('TokenManager.pollForDeviceToken token expired before user authorized');
    }

    private async validateAuthToken(epoch: number): Promise<void> {
        let response: Response;
        try {
            response = await fetch("https://id.twitch.tv/oauth2/validate", {
                method: 'GET',
                headers: { Authorization: 'OAuth ' + this.token }
            });
        } catch (error) {
            throw new TransientAuthError("TokenManager.validateAuthToken unreachable", { cause: error });
        }

        if (!response.ok) {
            // 429/5xx is id.twitch.tv's own trouble: keeping the token lets the
            // next tick retry instead of spending the refresh token.
            if (isTransientStatus(response.status)) {
                throw new TransientAuthError(
                    `TokenManager.validateAuthToken unavailable (${response.status})`);
            }
            this.token = null;
            throw new AuthRevokedError(
                `TokenManager.validateAuthToken token rejected (${response.status})`);
        }
        const data = await response.json();
        const validatedUserId = Number(data.user_id);

        // Bucket `token_<X>` must hold a token that really belongs to X, or a
        // corrupted bucket would serve one account's channels under another's.
        if (this.userId !== undefined && validatedUserId !== this.userId) {
            this.token = null;
            throw new AuthRevokedError(
                `TokenManager.validateAuthToken token belongs to ${validatedUserId}, expected ${this.userId}`);
        }

        this.userId = validatedUserId;
        this.setTokenExpirationDate(data.expires_in);
        await this.persist(epoch);
    }

    private refreshAccessToken(epoch: number): Promise<string> {
        // Twitch rotates the refresh token: a second POST with the spent one
        // comes back 400, indistinguishable from a revoked grant.
        if (this.refreshingPromise && this.refreshingEpoch === epoch) return this.refreshingPromise;

        this.refreshingEpoch = epoch;
        this.refreshingPromise = this.requestRefreshedToken(epoch).finally(() => {
            if (this.refreshingEpoch === epoch) this.refreshingPromise = null;
        });
        return this.refreshingPromise;
    }

    private async requestRefreshedToken(epoch: number): Promise<string> {
        if (!this.refreshToken) throw new AuthRevokedError('TokenManager.refreshAccessToken No refresh token');

        const body = new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
        });

        let response: Response;
        try {
            response = await fetch(this.TOKEN_URL, { method: 'POST', body });
        } catch (error) {
            throw new TransientAuthError('TokenManager.refreshAccessToken unreachable', { cause: error });
        }

        // A 5xx behind Twitch's edge answers HTML: a parse failure is not a
        // verdict on the grant.
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.access_token) {
            if (isRefreshTokenRejected(response.status, data)) {
                this.token = null;
                this.refreshToken = null;
                await this.persist(epoch, true);
                throw new AuthRevokedError(
                    `TokenManager.refreshAccessToken refresh token rejected (${response.status})`);
            }
            throw new TransientAuthError(
                `TokenManager.refreshAccessToken failed (${response.status})`);
        }

        this.token = data.access_token;
        this.refreshToken = data.refresh_token ?? this.refreshToken;
        this.setTokenExpirationDate(data.expires_in);
        await this.persist(epoch);
        return this.token!;
    }

    private setTokenExpirationDate(expires_in: number) {
        this.tokenExpirationDate = Date.now() + (expires_in * 1000);
        this.nextValidationDate = Date.now() + this.tokenValidationInterval;
    }
}
