import { TokenManager } from "@src/service_worker/token.ts";
import { jest, describe, beforeEach, test, expect, afterEach } from "@jest/globals";

/**
 * Tests des SEULES méthodes publiques de TokenManager :
 *   - getTokenFromStorage()
 *   - initAuthentification(callback)
 *   - getToken()
 *
 * Toutes les dépendances externes du module sont mockées :
 *   - global.fetch (routé par URL : validate / device / token)
 *   - chrome.storage.local (get promis, set/remove en jest.fn)
 */

// --- URLs appelées par token.ts ---------------------------------------------
const VALIDATE_URL = "https://id.twitch.tv/oauth2/validate";
const DEVICE_URL = "https://id.twitch.tv/oauth2/device";
const TOKEN_URL = "https://id.twitch.tv/oauth2/token";

type FakeResponse = {
    ok: boolean;
    status?: number;
    json: () => Promise<any>;
};

/** Construit un faux Response. */
function res(body: any, ok = true, status = 200): FakeResponse {
    return { ok, status, json: () => Promise.resolve(body) };
}

/**
 * Aiguille fetch selon l'URL. Chaque entrée est soit une réponse unique,
 * soit un tableau de réponses consommées dans l'ordre (une par appel).
 */
function mockFetchByUrl(map: {
    validate?: FakeResponse | FakeResponse[];
    device?: FakeResponse | FakeResponse[];
    token?: FakeResponse | FakeResponse[];
}) {
    const queues: Record<string, FakeResponse[]> = {
        validate: ([] as FakeResponse[]).concat(map.validate ?? []),
        device: ([] as FakeResponse[]).concat(map.device ?? []),
        token: ([] as FakeResponse[]).concat(map.token ?? []),
    };

    const fn = jest.fn((url: string) => {
        let key: keyof typeof queues;
        if (url.includes(VALIDATE_URL)) key = "validate";
        else if (url.includes(DEVICE_URL)) key = "device";
        else if (url.includes(TOKEN_URL)) key = "token";
        else return Promise.reject(new Error(`URL non mockée: ${url}`));

        const queue = queues[key];
        if (queue.length === 0) return Promise.reject(new Error(`Pas de réponse mockée pour ${key}`));
        // Rejoue la dernière réponse si le mock est épuisé mais qu'une seule a été fournie.
        const next = queue.length > 1 ? queue.shift()! : queue[0];
        return Promise.resolve(next);
    });

    global.fetch = fn as unknown as typeof fetch;
    return fn;
}

/** chrome.storage.local.get renvoie une Promise résolue avec `record`. */
function mockStorageGet(record: Record<string, unknown>) {
    (chrome.storage.local.get as unknown as jest.Mock).mockResolvedValue(record);
}

const FUTURE = () => Date.now() + 10 * 60 * 1000;
const PAST = () => Date.now() - 10 * 60 * 1000;

/** Vide la file de microtâches (plusieurs passes pour drainer les await chaînés). */
async function flushMicrotasks(passes = 15) {
    for (let i = 0; i < passes; i++) await Promise.resolve();
}

/**
 * Équivalent Jest 27 de `advanceTimersByTimeAsync` : on draine d'abord les
 * microtâches (pour que le setTimeout en attente soit programmé), on avance
 * les timers factices, puis on draine de nouveau (pour dérouler le code repris).
 */
async function advance(ms: number) {
    await flushMicrotasks();
    jest.advanceTimersByTime(ms);
    await flushMicrotasks();
}

/** Crée un TokenManager avec ses 3 callbacks mockés, exposés pour assertions. */
function makeManager() {
    const userAlreadyLoggedInCallbak = jest.fn();
    const userGotDisconnected = jest.fn();
    const noTokenFound = jest.fn(() => true);
    const manager = new TokenManager(
        userAlreadyLoggedInCallbak as any,
        userGotDisconnected as any,
        noTokenFound as any
    );
    return { manager, userAlreadyLoggedInCallbak, userGotDisconnected, noTokenFound };
}

describe("TokenManager", () => {
    beforeEach(() => {
        chrome.storage.local = {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
        } as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    // =====================================================================
    // getTokenFromStorage()
    // =====================================================================
    describe("getTokenFromStorage", () => {
        test("storage complet + validate OK → userAlreadyLoggedInCallbak(userId), résout null", async () => {
            const { manager, userAlreadyLoggedInCallbak } = makeManager();
            mockStorageGet({
                twitchToken: "stored_token",
                tokenExpirationDate: String(FUTURE()),
                nextValidationDate: String(FUTURE()),
                refreshToken: "refresh_1",
            });
            mockFetchByUrl({ validate: res({ user_id: 42, expires_in: 3600 }) });

            const result = await manager.getTokenFromStorage();

            expect(result).toBeNull();
            expect(manager.token).toBe("stored_token");
            expect(manager.userId).toBe(42);
            expect(userAlreadyLoggedInCallbak).toHaveBeenCalledWith(42);
        });

        test("storage sans refreshToken → noTokenFound() et throw", async () => {
            const { manager, noTokenFound, userAlreadyLoggedInCallbak } = makeManager();
            mockStorageGet({
                twitchToken: "stored_token",
                tokenExpirationDate: String(FUTURE()),
                nextValidationDate: String(FUTURE()),
                // refreshToken absent
            });
            mockFetchByUrl({});

            await expect(manager.getTokenFromStorage()).rejects.toThrow(
                "TokenManager.getTokenFromStorage"
            );
            expect(noTokenFound).toHaveBeenCalledTimes(1);
            expect(userAlreadyLoggedInCallbak).not.toHaveBeenCalled();
        });

        test("validate KO → refresh OK → validate OK → connecté", async () => {
            const { manager, userAlreadyLoggedInCallbak } = makeManager();
            mockStorageGet({
                twitchToken: "stale_token",
                tokenExpirationDate: String(PAST()),
                nextValidationDate: String(PAST()),
                refreshToken: "refresh_1",
            });
            mockFetchByUrl({
                validate: [res(null, false, 401), res({ user_id: 7, expires_in: 3600 })],
                token: res({ access_token: "refreshed_token", refresh_token: "refresh_2", expires_in: 3600 }),
            });

            await manager.getTokenFromStorage();

            expect(manager.token).toBe("refreshed_token");
            expect(manager.refreshToken).toBe("refresh_2");
            expect(manager.userId).toBe(7);
            expect(userAlreadyLoggedInCallbak).toHaveBeenCalledWith(7);
        });

        test("validate KO → refresh KO → throw + remove('refreshToken')", async () => {
            const { manager, userAlreadyLoggedInCallbak } = makeManager();
            mockStorageGet({
                twitchToken: "stale_token",
                tokenExpirationDate: String(PAST()),
                nextValidationDate: String(PAST()),
                refreshToken: "refresh_1",
            });
            mockFetchByUrl({
                validate: res(null, false, 401),
                token: res({}, false, 400), // refresh échoue
            });

            await expect(manager.getTokenFromStorage()).rejects.toThrow(
                "TokenManager.getTokenFromStorage"
            );
            expect(chrome.storage.local.remove).toHaveBeenCalledWith("refreshToken");
            expect(manager.refreshToken).toBeNull();
            expect(userAlreadyLoggedInCallbak).not.toHaveBeenCalled();
        });

        test("validate KO → refresh OK → 2ᵉ validate KO → throw", async () => {
            const { manager, userAlreadyLoggedInCallbak } = makeManager();
            mockStorageGet({
                twitchToken: "stale_token",
                tokenExpirationDate: String(PAST()),
                nextValidationDate: String(PAST()),
                refreshToken: "refresh_1",
            });
            mockFetchByUrl({
                validate: res(null, false, 401), // les deux validations échouent
                token: res({ access_token: "refreshed_token", expires_in: 3600 }),
            });

            await expect(manager.getTokenFromStorage()).rejects.toThrow(
                "TokenManager.getTokenFromStorage"
            );
            expect(userAlreadyLoggedInCallbak).not.toHaveBeenCalled();
        });
    });

    // =====================================================================
    // initAuthentification(callback)
    // =====================================================================
    describe("initAuthentification", () => {
        const deviceOk = () =>
            res({
                device_code: "DEV_CODE",
                user_code: "USER_CODE",
                verification_uri: "https://twitch.tv/activate",
                interval: 1,
                expires_in: 30,
            });

        test("device OK → poll renvoie access_token → validate OK → retourne le token", async () => {
            jest.useFakeTimers();
            const { manager, userAlreadyLoggedInCallbak } = makeManager();
            const callback = jest.fn();
            mockFetchByUrl({
                device: deviceOk(),
                token: res({ access_token: "new_token", refresh_token: "refresh_new", expires_in: 3600 }),
                validate: res({ user_id: 99, expires_in: 3600 }),
            });

            const promise = manager.initAuthentification(callback);
            await advance(1000); // 1ᵉ tick de poll

            await expect(promise).resolves.toBe("new_token");
            expect(callback).toHaveBeenCalledWith({
                user_code: "USER_CODE",
                verification_uri: "https://twitch.tv/activate",
            });
            expect(manager.currentDeviceCodeInfo).toMatchObject({ device_code: "DEV_CODE" });
            expect(manager.userId).toBe(99);
            expect(userAlreadyLoggedInCallbak).toHaveBeenCalledWith(99);
        });

        test("requestDeviceCode KO → throw", async () => {
            const { manager } = makeManager();
            mockFetchByUrl({ device: res(null, false, 500) });

            await expect(manager.initAuthentification(jest.fn())).rejects.toThrow(
                "No token found and unable to get a new one."
            );
        });

        test("poll: authorization_pending puis access_token → succès (≥2 appels token)", async () => {
            jest.useFakeTimers();
            const { manager } = makeManager();
            const tokenFetch = mockFetchByUrl({
                device: deviceOk(),
                token: [
                    res({ message: "authorization_pending" }),
                    res({ access_token: "token_after_wait", expires_in: 3600 }),
                ],
                validate: res({ user_id: 1, expires_in: 3600 }),
            });

            const promise = manager.initAuthentification(jest.fn());
            await advance(1000); // pending
            await advance(1000); // access_token

            await expect(promise).resolves.toBe("token_after_wait");
            const tokenCalls = tokenFetch.mock.calls.filter((c) => (c[0] as string).includes(TOKEN_URL));
            expect(tokenCalls.length).toBeGreaterThanOrEqual(2);
        });

        test("poll: slow_down puis access_token → succès (incrément d'interval)", async () => {
            jest.useFakeTimers();
            const { manager } = makeManager();
            mockFetchByUrl({
                device: deviceOk(),
                token: [
                    res({ message: "slow_down" }),
                    res({ access_token: "token_slow", expires_in: 3600 }),
                ],
                validate: res({ user_id: 1, expires_in: 3600 }),
            });

            const promise = manager.initAuthentification(jest.fn());
            await advance(1000); // slow_down (interval passe à 6)
            await advance(6000); // access_token après le nouvel intervalle

            await expect(promise).resolves.toBe("token_slow");
        });

        test("poll: message d'erreur (access_denied) → throw", async () => {
            jest.useFakeTimers();
            const { manager } = makeManager();
            mockFetchByUrl({
                device: deviceOk(),
                token: res({ message: "access_denied" }),
            });

            const promise = manager.initAuthentification(jest.fn());
            const expectation = expect(promise).rejects.toThrow(
                "No token found and unable to get a new one."
            );
            await advance(1000);
            await expectation;
        });

        test("poll: jamais autorisé jusqu'à expiration → throw", async () => {
            jest.useFakeTimers();
            const { manager } = makeManager();
            mockFetchByUrl({
                device: res({
                    device_code: "DEV_CODE",
                    user_code: "USER_CODE",
                    verification_uri: "https://twitch.tv/activate",
                    interval: 1,
                    expires_in: 2, // fenêtre très courte
                }),
                token: res({ message: "authorization_pending" }),
            });

            const promise = manager.initAuthentification(jest.fn());
            const expectation = expect(promise).rejects.toThrow(
                "No token found and unable to get a new one."
            );
            await advance(3000); // dépasse expiresAt
            await expectation;
        });

        test("device OK, poll OK, validate KO → throw", async () => {
            jest.useFakeTimers();
            const { manager, userAlreadyLoggedInCallbak } = makeManager();
            mockFetchByUrl({
                device: deviceOk(),
                token: res({ access_token: "new_token", expires_in: 3600 }),
                validate: res(null, false, 401),
            });

            const promise = manager.initAuthentification(jest.fn());
            const expectation = expect(promise).rejects.toThrow(
                "No token found and unable to get a new one."
            );
            await advance(1000);
            await expectation;
            expect(userAlreadyLoggedInCallbak).not.toHaveBeenCalled();
        });
    });

    // =====================================================================
    // getToken()
    // =====================================================================
    describe("getToken", () => {
        test("token en mémoire valide → résout sans fetch", async () => {
            const { manager } = makeManager();
            manager.token = "valid_token";
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = FUTURE();
            const fetchFn = mockFetchByUrl({});

            await expect(manager.getToken()).resolves.toBe("valid_token");
            expect(fetchFn).not.toHaveBeenCalled();
        });

        test("invalide, validate OK → résout le token (1 fetch)", async () => {
            const { manager } = makeManager();
            manager.token = "valid_token";
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = PAST(); // période de validation dépassée
            const fetchFn = mockFetchByUrl({ validate: res({ user_id: 3, expires_in: 3600 }) });

            await expect(manager.getToken()).resolves.toBe("valid_token");
            expect(fetchFn).toHaveBeenCalledTimes(1);
        });

        test("invalide, validate KO, refreshToken présent, refresh OK → nouveau token", async () => {
            const { manager } = makeManager();
            manager.token = "old_token";
            manager.refreshToken = "refresh_1";
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = PAST();
            mockFetchByUrl({
                validate: res(null, false, 401),
                token: res({ access_token: "refreshed_token", refresh_token: "refresh_2", expires_in: 3600 }),
            });

            await expect(manager.getToken()).resolves.toBe("refreshed_token");
            expect(manager.refreshToken).toBe("refresh_2");
        });

        test("invalide, validate KO, refresh KO → throw", async () => {
            const { manager } = makeManager();
            manager.token = "old_token";
            manager.refreshToken = "refresh_1";
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = PAST();
            mockFetchByUrl({
                validate: res(null, false, 401),
                token: res({}, false, 400),
            });

            await expect(manager.getToken()).rejects.toThrow("failed to refresh token");
        });

        test("invalide, validate KO, pas de refreshToken → device flow OK → token", async () => {
            jest.useFakeTimers();
            const { manager } = makeManager();
            manager.token = "old_token";
            manager.refreshToken = null;
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = PAST();
            mockFetchByUrl({
                validate: [res(null, false, 401), res({ user_id: 5, expires_in: 3600 })],
                device: res({
                    device_code: "DEV_CODE",
                    user_code: "USER_CODE",
                    verification_uri: "https://twitch.tv/activate",
                    interval: 1,
                    expires_in: 30,
                }),
                token: res({ access_token: "device_token", expires_in: 3600 }),
            });

            const promise = manager.getToken();
            await advance(1000);

            await expect(promise).resolves.toBe("device_token");
        });

        test("invalide, validate KO, pas de refreshToken, device flow KO → throw", async () => {
            const { manager } = makeManager();
            manager.token = "old_token";
            manager.refreshToken = null;
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = PAST();
            mockFetchByUrl({
                validate: res(null, false, 401),
                device: res(null, false, 500),
            });

            await expect(manager.getToken()).rejects.toThrow("failed to get new token or validate");
        });

        test("appels concurrents → une seule validation, fetchingPromise partagée puis réinitialisée", async () => {
            const { manager } = makeManager();
            manager.token = "valid_token";
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = PAST();
            const fetchFn = mockFetchByUrl({ validate: res({ user_id: 3, expires_in: 3600 }) });

            const [a, b] = await Promise.all([manager.getToken(), manager.getToken()]);
            expect(a).toBe("valid_token");
            expect(b).toBe("valid_token");
            expect(fetchFn).toHaveBeenCalledTimes(1); // fetchingPromise partagée

            // nextValidationDate a été rafraîchie par validate → 3ᵉ appel n'entraîne plus de fetch
            await manager.getToken();
            expect(fetchFn).toHaveBeenCalledTimes(1);
        });
    });
});
