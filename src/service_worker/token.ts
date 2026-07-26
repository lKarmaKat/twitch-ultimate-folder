import { logErrorChain, wrapError } from "./errors";
import { CLIENT_ID, tokenKey } from "../constantes";

export interface DeviceCodeInfo {
    user_code: string;
    verification_uri: string;
    device_code: string;
}

/** Contenu de la clé `token_<userId>` dans chrome.storage.local. */
export interface StoredToken {
    twitchToken: string | null;
    refreshToken: string | null;
    tokenExpirationDate: number;
    nextValidationDate: number;
}

/**
 * Gère les tokens OAuth d'UN compte à la fois, mais les persiste par compte
 * (`token_<userId>`), ce qui permet de basculer d'un utilisateur à l'autre sans
 * ré-autorisation.
 *
 * L'userId est une ENTRÉE, fournie par la session Twitch du navigateur, et non
 * plus une sortie de la validation : c'est ce qui permet de savoir quel jeu de
 * tokens charger avant le moindre appel réseau.
 *
 * Cette classe n'orchestre rien : elle ne connaît ni la config, ni le poller,
 * ni les ports. Le seul signal qu'elle émet est `onAuthLost`, quand un token
 * devient irrécupérable en cours de session (révocation depuis les paramètres
 * Twitch, typiquement).
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

    /** Posé par le background : le token du compte courant n'est plus récupérable. */
    onAuthLost?: () => void;

    /**
     * Repointe le manager sur `userId` et tente de rendre son token utilisable.
     * @returns true si un token valide est disponible, false s'il faut autoriser.
     */
    async switchUser(userId: number): Promise<boolean> {
        this.reset();
        this.userId = userId;

        const key = tokenKey(userId);
        const stored = (await chrome.storage.local.get(key))[key] as StoredToken | undefined;
        // Une bascule plus récente est passée pendant la lecture du storage :
        // continuer écrirait l'état de cet utilisateur-ci par-dessus le sien.
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
     * Lance le device flow POUR un compte donné. Jamais appelé automatiquement :
     * c'est une action explicite de l'utilisateur depuis l'action popup.
     *
     * Fixer `userId` avant de démarrer est indispensable — `pollForDeviceToken`
     * persiste le token dès réception, or à ce moment aucune validation n'a
     * encore eu lieu et il n'y aurait donc aucune clé sous laquelle écrire.
     */
    async startAuthFor(userId: number, callback: ((info: { user_code: string; verification_uri: string }) => void) | null): Promise<string> {
        if (this.authInProgressPromise && this.userId === userId) {
            // Popup rouverte pendant le polling : on se raccroche au flow en cours.
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

    /** Déconnexion Twitch : on oublie l'état en mémoire, jamais le storage. */
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
                // Pas de repli sur le device flow : une autorisation ne peut
                // partir que d'un geste explicite de l'utilisateur. On signale
                // la perte, le background bascule l'UI sur « à autoriser ».
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
     * Remet à zéro l'état ET les promesses en vol. Ces dernières sont le point
     * critique : sans ça, un device flow lancé pour le compte A se résoudrait
     * dans le contexte du compte B et écrirait le token de A sous `token_<B>`.
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
            // Un code d'activation n'existe que TANT QU'IL attend d'être saisi.
            // Le laisser en place après coup fait afficher indéfiniment à
            // l'action popup un code déjà consommé — y compris, et surtout,
            // après une autorisation réussie.
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
                // Le polling dure des dizaines de secondes : l'utilisateur a pu
                // changer de compte Twitch entre-temps. `reset()` a bien coupé
                // authInProgressPromise, mais cette boucle-ci tourne toujours et
                // persisterait le token du compte A sous la clé du compte B.
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

        // Le bucket `token_<X>` doit contenir un token appartenant bien à X.
        // Sans ce contrôle, un bucket corrompu servirait les chaînes d'un compte
        // sous la config d'un autre — exactement ce que le multi-comptes doit
        // rendre impossible.
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
