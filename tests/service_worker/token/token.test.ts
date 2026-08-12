import { TokenManager, isRefreshTokenRejected } from "@src/service_worker/token.ts";
import { tokenKey } from "@src/constantes.ts";
import { jest, describe, beforeEach, test, expect, afterEach } from "@jest/globals";

/**
 * Tests des SEULES méthodes publiques de TokenManager :
 *   - switchUser(userId)
 *   - startAuthFor(userId, callback)
 *   - getToken()
 *   - clear()
 *
 * Toutes les dépendances externes du module sont mockées :
 *   - global.fetch (routé par URL : validate / device / token)
 *   - chrome.storage.local (get promis, set/remove en jest.fn)
 */

// --- URLs appelées par token.ts ---------------------------------------------
const VALIDATE_URL = "https://id.twitch.tv/oauth2/validate";
const DEVICE_URL = "https://id.twitch.tv/oauth2/device";
const TOKEN_URL = "https://id.twitch.tv/oauth2/token";

const USER_ID = 42;

type FakeResponse = {
    ok: boolean;
    status?: number;
    json: () => Promise<any>;
};

/** An Error stands for a rejected fetch (offline, DNS failure). */
type FetchOutcome = FakeResponse | Error;

/** Construit un faux Response. */
function res(body: any, ok = true, status = 200): FakeResponse {
    return { ok, status, json: () => Promise.resolve(body) };
}

/** A 5xx behind Twitch's edge answers HTML, so json() rejects. */
function resHtml(status: number): FakeResponse {
    return { ok: false, status, json: () => Promise.reject(new SyntaxError("Unexpected token '<'")) };
}

/** Twitch's own body for a spent or revoked grant. */
const REJECTED_GRANT_BODY = { error: 'Bad Request', status: 400, message: 'Invalid refresh token' };

/**
 * Aiguille fetch selon l'URL. Chaque entrée est soit une réponse unique,
 * soit un tableau de réponses consommées dans l'ordre (une par appel).
 */
function mockFetchByUrl(map: {
    validate?: FetchOutcome | FetchOutcome[];
    device?: FetchOutcome | FetchOutcome[];
    token?: FetchOutcome | FetchOutcome[];
}) {
    const queues: Record<string, FetchOutcome[]> = {
        validate: ([] as FetchOutcome[]).concat(map.validate ?? []),
        device: ([] as FetchOutcome[]).concat(map.device ?? []),
        token: ([] as FetchOutcome[]).concat(map.token ?? []),
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
        return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
    });

    global.fetch = fn as unknown as typeof fetch;
    return fn;
}

/** Contenu du bucket `token_<userId>` renvoyé par chrome.storage.local.get. */
function mockStoredToken(userId: number, stored: Record<string, unknown> | undefined) {
    (chrome.storage.local.get as unknown as jest.Mock).mockResolvedValue(
        stored ? { [tokenKey(userId)]: stored } : {}
    );
}

/** Dernier objet écrit sous `token_<userId>`. */
function lastPersisted(userId: number): any {
    const calls = (chrome.storage.local.set as unknown as jest.Mock).mock.calls;
    for (let i = calls.length - 1; i >= 0; i--) {
        const arg = calls[i][0] as Record<string, unknown>;
        if (arg && tokenKey(userId) in arg) return arg[tokenKey(userId)];
    }
    return undefined;
}

/** Every object ever written under `token_<userId>`, oldest first. */
function allPersisted(userId: number): any[] {
    return (chrome.storage.local.set as unknown as jest.Mock).mock.calls
        .map(call => (call[0] as Record<string, unknown>)[tokenKey(userId)])
        .filter(value => value !== undefined);
}

/** A promise whose settlement the test drives, to park a fetch mid-flight. */
function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(r => { resolve = r; });
    return { promise, resolve };
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
    // switchUser()
    // =====================================================================
    describe("switchUser", () => {
        test("bucket absent → false, aucun appel réseau", async () => {
            const manager = new TokenManager();
            mockStoredToken(USER_ID, undefined);
            const fetchFn = mockFetchByUrl({});

            await expect(manager.switchUser(USER_ID)).resolves.toBe(false);
            expect(manager.userId).toBe(USER_ID); // l'userId est posé quand même
            expect(fetchFn).not.toHaveBeenCalled();
        });

        test("bucket sans refreshToken → false", async () => {
            const manager = new TokenManager();
            mockStoredToken(USER_ID, {
                twitchToken: "stored_token",
                refreshToken: null,
                tokenExpirationDate: FUTURE(),
                nextValidationDate: FUTURE(),
            });
            const fetchFn = mockFetchByUrl({});

            await expect(manager.switchUser(USER_ID)).resolves.toBe(false);
            expect(fetchFn).not.toHaveBeenCalled();
        });

        test("bucket complet + validate OK → true", async () => {
            const manager = new TokenManager();
            mockStoredToken(USER_ID, {
                twitchToken: "stored_token",
                refreshToken: "refresh_1",
                tokenExpirationDate: FUTURE(),
                nextValidationDate: FUTURE(),
            });
            mockFetchByUrl({ validate: res({ user_id: USER_ID, expires_in: 3600 }) });

            await expect(manager.switchUser(USER_ID)).resolves.toBe(true);
            expect(manager.token).toBe("stored_token");
            expect(manager.userId).toBe(USER_ID);
        });

        test("validate KO → refresh OK → validate OK → true, persisté sous token_<id>", async () => {
            const manager = new TokenManager();
            mockStoredToken(USER_ID, {
                twitchToken: "stale_token",
                refreshToken: "refresh_1",
                tokenExpirationDate: PAST(),
                nextValidationDate: PAST(),
            });
            mockFetchByUrl({
                validate: [res(null, false, 401), res({ user_id: USER_ID, expires_in: 3600 })],
                token: res({ access_token: "refreshed_token", refresh_token: "refresh_2", expires_in: 3600 }),
            });

            await expect(manager.switchUser(USER_ID)).resolves.toBe(true);
            expect(manager.token).toBe("refreshed_token");
            expect(manager.refreshToken).toBe("refresh_2");
            expect(lastPersisted(USER_ID)).toMatchObject({
                twitchToken: "refreshed_token",
                refreshToken: "refresh_2",
            });
        });

        test("a refresh rejected as a dead grant clears the bucket on purpose", async () => {
            const manager = new TokenManager();
            mockStoredToken(USER_ID, {
                twitchToken: "stale_token",
                refreshToken: "refresh_1",
                tokenExpirationDate: PAST(),
                nextValidationDate: PAST(),
            });
            mockFetchByUrl({
                validate: res(null, false, 401),
                token: res(REJECTED_GRANT_BODY, false, 400),
            });

            await expect(manager.switchUser(USER_ID)).resolves.toBe(false);
            expect(manager.refreshToken).toBeNull();
            expect(lastPersisted(USER_ID)).toMatchObject({ twitchToken: null, refreshToken: null });
        });

        test.each([
            ["a 500", res({}, false, 500)],
            ["a 429", res({}, false, 429)],
            ["an ambiguous 400", res({}, false, 400)],
            ["an HTML error body", resHtml(502)],
            ["an unreachable host", new Error("Failed to fetch")],
        ])("a refresh failing on %s leaves the stored credentials untouched", async (_label, outcome) => {
            const manager = new TokenManager();
            mockStoredToken(USER_ID, {
                twitchToken: "stale_token",
                refreshToken: "refresh_1",
                tokenExpirationDate: PAST(),
                nextValidationDate: PAST(),
            });
            mockFetchByUrl({
                validate: res(null, false, 401),
                token: outcome as any,
            });

            await expect(manager.switchUser(USER_ID)).resolves.toBe(false);
            expect(manager.refreshToken).toBe("refresh_1");
            expect(allPersisted(USER_ID)).toEqual([]);
        });

        test("an unreachable validation endpoint never spends the refresh token", async () => {
            const manager = new TokenManager();
            mockStoredToken(USER_ID, {
                twitchToken: "stored_token",
                refreshToken: "refresh_1",
                tokenExpirationDate: PAST(),
                nextValidationDate: PAST(),
            });
            mockFetchByUrl({
                validate: new Error("Failed to fetch"),
                token: new Error("Failed to fetch"),
            });

            await expect(manager.switchUser(USER_ID)).resolves.toBe(false);
            expect(manager.refreshToken).toBe("refresh_1");
            expect(allPersisted(USER_ID)).toEqual([]);
        });

        test("a 5xx on validation keeps the token instead of nulling it", async () => {
            const manager = new TokenManager();
            mockStoredToken(USER_ID, {
                twitchToken: "stored_token",
                refreshToken: "refresh_1",
                tokenExpirationDate: PAST(),
                nextValidationDate: PAST(),
            });
            mockFetchByUrl({
                validate: res({}, false, 503),
                token: res({}, false, 503),
            });

            await expect(manager.switchUser(USER_ID)).resolves.toBe(false);
            expect(manager.token).toBe("stored_token");
            expect(allPersisted(USER_ID)).toEqual([]);
        });

        test("two switches for the same account share one flow and never persist nulls", async () => {
            // The reported bug: the second switch's reset() blanked the state the
            // first was about to persist after a SUCCESSFUL validation.
            const manager = new TokenManager();
            mockStoredToken(USER_ID, {
                twitchToken: "stored_token",
                refreshToken: "refresh_1",
                tokenExpirationDate: PAST(),
                nextValidationDate: PAST(),
            });
            const validate = deferred<FakeResponse>();
            const fetchFn = jest.fn(() => validate.promise);
            global.fetch = fetchFn as unknown as typeof fetch;

            const first = manager.switchUser(USER_ID);
            await flushMicrotasks();                    // parked on validate
            const second = manager.switchUser(USER_ID); // the duplicate tab report
            validate.resolve(res({ user_id: USER_ID, expires_in: 3600 }));

            await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
            expect(fetchFn).toHaveBeenCalledTimes(1);
            expect(manager.refreshToken).toBe("refresh_1");
            expect(allPersisted(USER_ID).filter(bucket => bucket.refreshToken === null)).toEqual([]);
            expect(lastPersisted(USER_ID)).toMatchObject({
                twitchToken: "stored_token",
                refreshToken: "refresh_1",
            });
        });

        test("a switch superseded by another account writes nothing under the old key", async () => {
            const manager = new TokenManager();
            mockStoredToken(1, {
                twitchToken: "token_a",
                refreshToken: "refresh_a",
                tokenExpirationDate: PAST(),
                nextValidationDate: PAST(),
            });
            const validateA = deferred<FakeResponse>();
            global.fetch = jest.fn(() => validateA.promise) as unknown as typeof fetch;

            const first = manager.switchUser(1);
            await flushMicrotasks();

            mockStoredToken(2, undefined);
            const second = manager.switchUser(2);
            validateA.resolve(res({ user_id: 1, expires_in: 3600 }));

            await expect(first).resolves.toBe(false);
            await expect(second).resolves.toBe(false);
            expect(allPersisted(1)).toEqual([]);
        });

        test("bucket contenant le token d'un AUTRE compte → false", async () => {
            // Le garde qui empêche de servir les chaînes d'un compte sous la
            // config d'un autre.
            const manager = new TokenManager();
            mockStoredToken(USER_ID, {
                twitchToken: "token_of_someone_else",
                refreshToken: "refresh_1",
                tokenExpirationDate: FUTURE(),
                nextValidationDate: FUTURE(),
            });
            mockFetchByUrl({
                validate: res({ user_id: 999, expires_in: 3600 }),
                token: res({ access_token: "still_someone_else", expires_in: 3600 }),
            });

            await expect(manager.switchUser(USER_ID)).resolves.toBe(false);
            expect(manager.token).toBeNull();
        });

        test("bascule A → B : l'état du compte précédent est purgé", async () => {
            const manager = new TokenManager();
            mockStoredToken(1, {
                twitchToken: "token_a",
                refreshToken: "refresh_a",
                tokenExpirationDate: FUTURE(),
                nextValidationDate: FUTURE(),
            });
            mockFetchByUrl({ validate: res({ user_id: 1, expires_in: 3600 }) });
            await manager.switchUser(1);
            expect(manager.token).toBe("token_a");

            mockStoredToken(2, undefined); // B n'a jamais autorisé l'extension
            await expect(manager.switchUser(2)).resolves.toBe(false);
            expect(manager.userId).toBe(2);
            expect(manager.token).toBeNull();
            expect(manager.refreshToken).toBeNull();
        });
    });

    // =====================================================================
    // startAuthFor(userId, callback)
    // =====================================================================
    describe("startAuthFor", () => {
        const deviceOk = () =>
            res({
                device_code: "DEV_CODE",
                user_code: "USER_CODE",
                verification_uri: "https://twitch.tv/activate",
                interval: 1,
                expires_in: 30,
            });

        test("device OK → poll renvoie access_token → validate OK → token persisté sous token_<id>", async () => {
            jest.useFakeTimers();
            const manager = new TokenManager();
            const callback = jest.fn();
            mockFetchByUrl({
                device: deviceOk(),
                token: res({ access_token: "new_token", refresh_token: "refresh_new", expires_in: 3600 }),
                validate: res({ user_id: USER_ID, expires_in: 3600 }),
            });

            const promise = manager.startAuthFor(USER_ID, callback);
            await advance(1000); // 1ᵉʳ tick de poll

            await expect(promise).resolves.toBe("new_token");
            expect(callback).toHaveBeenCalledWith({
                user_code: "USER_CODE",
                verification_uri: "https://twitch.tv/activate",
            });
            // Le code est retiré une fois le flow terminé : sinon l'action
            // popup continuerait d'afficher un code déjà consommé.
            expect(manager.currentDeviceCodeInfo).toBeNull();
            expect(manager.userId).toBe(USER_ID);
            // L'userId doit être connu AVANT l'écriture : sinon aucune clé sous
            // laquelle persister le token reçu.
            expect(lastPersisted(USER_ID)).toMatchObject({
                twitchToken: "new_token",
                refreshToken: "refresh_new",
            });
        });

        test("currentDeviceCodeInfo n'existe QUE pendant l'attente de saisie", async () => {
            // C'est cet objet que l'action popup interroge pour réafficher un
            // code en cours ; s'il survit au flow, la popup reste bloquée sur
            // la vue d'autorisation après une autorisation pourtant réussie.
            jest.useFakeTimers();
            const manager = new TokenManager();
            mockFetchByUrl({
                device: deviceOk(),
                token: [
                    res({ message: "authorization_pending" }),
                    res({ access_token: "new_token", expires_in: 3600 }),
                ],
                validate: res({ user_id: USER_ID, expires_in: 3600 }),
            });

            const promise = manager.startAuthFor(USER_ID, jest.fn());
            await advance(1000); // code émis, saisie en attente
            expect(manager.currentDeviceCodeInfo).toMatchObject({ user_code: "USER_CODE" });

            await advance(1000); // autorisation reçue
            await expect(promise).resolves.toBe("new_token");
            expect(manager.currentDeviceCodeInfo).toBeNull();
        });

        test("device flow en échec → le code est retiré aussi", async () => {
            jest.useFakeTimers();
            const manager = new TokenManager();
            mockFetchByUrl({
                device: deviceOk(),
                token: res({ message: "access_denied" }),
            });

            const promise = manager.startAuthFor(USER_ID, jest.fn());
            const expectation = expect(promise).rejects.toThrow("TokenManager.startAuthFor");
            await advance(1000);
            await expectation;

            expect(manager.currentDeviceCodeInfo).toBeNull();
        });

        test("requestDeviceCode KO → throw", async () => {
            const manager = new TokenManager();
            mockFetchByUrl({ device: res(null, false, 500) });

            await expect(manager.startAuthFor(USER_ID, jest.fn())).rejects.toThrow(
                "TokenManager.startAuthFor failed to obtain a token"
            );
        });

        test("poll: authorization_pending puis access_token → succès (≥2 appels token)", async () => {
            jest.useFakeTimers();
            const manager = new TokenManager();
            const tokenFetch = mockFetchByUrl({
                device: deviceOk(),
                token: [
                    res({ message: "authorization_pending" }),
                    res({ access_token: "token_after_wait", expires_in: 3600 }),
                ],
                validate: res({ user_id: USER_ID, expires_in: 3600 }),
            });

            const promise = manager.startAuthFor(USER_ID, jest.fn());
            await advance(1000); // pending
            await advance(1000); // access_token

            await expect(promise).resolves.toBe("token_after_wait");
            const tokenCalls = tokenFetch.mock.calls.filter((c) => (c[0] as string).includes(TOKEN_URL));
            expect(tokenCalls.length).toBeGreaterThanOrEqual(2);
        });

        test("poll: slow_down puis access_token → succès (incrément d'interval)", async () => {
            jest.useFakeTimers();
            const manager = new TokenManager();
            mockFetchByUrl({
                device: deviceOk(),
                token: [
                    res({ message: "slow_down" }),
                    res({ access_token: "token_slow", expires_in: 3600 }),
                ],
                validate: res({ user_id: USER_ID, expires_in: 3600 }),
            });

            const promise = manager.startAuthFor(USER_ID, jest.fn());
            await advance(1000); // slow_down (interval passe à 6)
            await advance(6000); // access_token après le nouvel intervalle

            await expect(promise).resolves.toBe("token_slow");
        });

        test("poll: message d'erreur (access_denied) → throw", async () => {
            jest.useFakeTimers();
            const manager = new TokenManager();
            mockFetchByUrl({
                device: deviceOk(),
                token: res({ message: "access_denied" }),
            });

            const promise = manager.startAuthFor(USER_ID, jest.fn());
            const expectation = expect(promise).rejects.toThrow(
                "TokenManager.startAuthFor failed to obtain a token"
            );
            await advance(1000);
            await expectation;
        });

        test("poll: jamais autorisé jusqu'à expiration → throw", async () => {
            jest.useFakeTimers();
            const manager = new TokenManager();
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

            const promise = manager.startAuthFor(USER_ID, jest.fn());
            const expectation = expect(promise).rejects.toThrow(
                "TokenManager.startAuthFor failed to obtain a token"
            );
            await advance(3000); // dépasse expiresAt
            await expectation;
        });

        test("device OK, poll OK, validate KO → throw", async () => {
            jest.useFakeTimers();
            const manager = new TokenManager();
            mockFetchByUrl({
                device: deviceOk(),
                token: res({ access_token: "new_token", expires_in: 3600 }),
                validate: res(null, false, 401),
            });

            const promise = manager.startAuthFor(USER_ID, jest.fn());
            const expectation = expect(promise).rejects.toThrow(
                "TokenManager.startAuthFor failed to obtain a token"
            );
            await advance(1000);
            await expectation;
        });

        test("second appel pour le MÊME compte → se raccroche au flow en cours", async () => {
            jest.useFakeTimers();
            const manager = new TokenManager();
            const deviceFetch = mockFetchByUrl({
                device: deviceOk(),
                token: res({ access_token: "new_token", expires_in: 3600 }),
                validate: res({ user_id: USER_ID, expires_in: 3600 }),
            });

            const first = manager.startAuthFor(USER_ID, jest.fn());
            await flushMicrotasks();
            const second = manager.startAuthFor(USER_ID, jest.fn());
            await advance(1000);

            await expect(first).resolves.toBe("new_token");
            await expect(second).resolves.toBe("new_token");
            const deviceCalls = deviceFetch.mock.calls.filter((c) => (c[0] as string).includes(DEVICE_URL));
            expect(deviceCalls.length).toBe(1); // un seul device code demandé
        });

        test("changement de compte PENDANT le device flow → rien n'est persisté", async () => {
            // Le polling dure des dizaines de secondes. reset() coupe bien
            // authInProgressPromise, mais la boucle déjà lancée continue : sans
            // garde, elle écrirait le token du compte 1 sous la clé du compte 2.
            jest.useFakeTimers();
            const manager = new TokenManager();
            mockFetchByUrl({
                device: deviceOk(),
                token: [
                    res({ message: "authorization_pending" }),
                    res({ access_token: "token_for_1", expires_in: 3600 }),
                ],
                validate: res({ user_id: 1, expires_in: 3600 }),
            });

            const promise = manager.startAuthFor(1, jest.fn());
            const expectation = expect(promise).rejects.toThrow(
                "TokenManager.startAuthFor failed to obtain a token"
            );
            await advance(1000); // 1ᵉʳ poll : authorization_pending

            manager.userId = 2; // l'utilisateur a basculé sur un autre compte Twitch

            await advance(1000); // 2ᵉ poll : access_token, qui doit être refusé
            await expectation;

            expect(lastPersisted(1)).toBeUndefined();
            expect(lastPersisted(2)).toBeUndefined();
        });
    });

    // =====================================================================
    // getToken()
    // =====================================================================
    describe("getToken", () => {
        test("token en mémoire valide → résout sans fetch", async () => {
            const manager = new TokenManager();
            manager.token = "valid_token";
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = FUTURE();
            const fetchFn = mockFetchByUrl({});

            await expect(manager.getToken()).resolves.toBe("valid_token");
            expect(fetchFn).not.toHaveBeenCalled();
        });

        test("invalide, validate OK → résout le token (1 fetch)", async () => {
            const manager = new TokenManager();
            manager.userId = USER_ID;
            manager.token = "valid_token";
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = PAST(); // période de validation dépassée
            const fetchFn = mockFetchByUrl({ validate: res({ user_id: USER_ID, expires_in: 3600 }) });

            await expect(manager.getToken()).resolves.toBe("valid_token");
            expect(fetchFn).toHaveBeenCalledTimes(1);
        });

        test("invalide, validate KO, refresh OK → nouveau token", async () => {
            const manager = new TokenManager();
            manager.userId = USER_ID;
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

        test("invalide, validate KO, refresh rejeté → throw + onAuthLost", async () => {
            const manager = new TokenManager();
            const onAuthLost = jest.fn();
            manager.onAuthLost = onAuthLost;
            manager.userId = USER_ID;
            manager.token = "old_token";
            manager.refreshToken = "refresh_1";
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = PAST();
            mockFetchByUrl({
                validate: res(null, false, 401),
                token: res(REJECTED_GRANT_BODY, false, 400),
            });

            await expect(manager.getToken()).rejects.toThrow("failed to refresh token");
            expect(onAuthLost).toHaveBeenCalledTimes(1);
        });

        test.each([
            ["an unreachable host", new Error("Failed to fetch")],
            ["a 503", res({}, false, 503)],
            ["an ambiguous 400", res({}, false, 400)],
        ])("%s on refresh is not reported as a lost authorization", async (_label, outcome) => {
            const manager = new TokenManager();
            const onAuthLost = jest.fn();
            manager.onAuthLost = onAuthLost;
            manager.userId = USER_ID;
            manager.token = "old_token";
            manager.refreshToken = "refresh_1";
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = PAST();
            mockFetchByUrl({
                validate: res(null, false, 401),
                token: outcome as any,
            });

            await expect(manager.getToken()).rejects.toThrow("failed to refresh token");
            expect(onAuthLost).not.toHaveBeenCalled();
            expect(manager.refreshToken).toBe("refresh_1");
            expect(chrome.storage.local.set).not.toHaveBeenCalled();
        });

        test("un 503 sur validate sans refreshToken n'est pas une autorisation perdue", async () => {
            const manager = new TokenManager();
            const onAuthLost = jest.fn();
            manager.onAuthLost = onAuthLost;
            manager.userId = USER_ID;
            manager.token = "old_token";
            manager.refreshToken = null;
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = PAST();
            mockFetchByUrl({ validate: res({}, false, 503) });

            await expect(manager.getToken()).rejects.toThrow("no refresh token available");
            expect(onAuthLost).not.toHaveBeenCalled();
        });

        test("invalidateToken force la revalidation au prochain getToken", async () => {
            const manager = new TokenManager();
            manager.userId = USER_ID;
            manager.token = "valid_token";
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = FUTURE();
            const fetchFn = mockFetchByUrl({ validate: res({ user_id: USER_ID, expires_in: 3600 }) });

            await manager.getToken();
            expect(fetchFn).not.toHaveBeenCalled(); // fenêtre encore ouverte

            manager.invalidateToken();
            await manager.getToken();
            expect(fetchFn).toHaveBeenCalledTimes(1);
        });

        test("pas de refreshToken → throw SANS lancer de device flow", async () => {
            // Régression : une autorisation ne doit partir que d'un geste
            // explicite de l'utilisateur, jamais d'un appel de fond.
            const manager = new TokenManager();
            const onAuthLost = jest.fn();
            manager.onAuthLost = onAuthLost;
            manager.userId = USER_ID;
            manager.token = "old_token";
            manager.refreshToken = null;
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = PAST();
            const fetchFn = mockFetchByUrl({ validate: res(null, false, 401) });

            await expect(manager.getToken()).rejects.toThrow("no refresh token available");
            expect(onAuthLost).toHaveBeenCalledTimes(1);
            const deviceCalls = fetchFn.mock.calls.filter((c) => (c[0] as string).includes(DEVICE_URL));
            expect(deviceCalls.length).toBe(0);
        });

        test("appels concurrents → une seule validation, fetchingPromise partagée puis réinitialisée", async () => {
            const manager = new TokenManager();
            manager.userId = USER_ID;
            manager.token = "valid_token";
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = PAST();
            const fetchFn = mockFetchByUrl({ validate: res({ user_id: USER_ID, expires_in: 3600 }) });

            const [a, b] = await Promise.all([manager.getToken(), manager.getToken()]);
            expect(a).toBe("valid_token");
            expect(b).toBe("valid_token");
            expect(fetchFn).toHaveBeenCalledTimes(1); // fetchingPromise partagée

            // nextValidationDate a été rafraîchie par validate → 3ᵉ appel n'entraîne plus de fetch
            await manager.getToken();
            expect(fetchFn).toHaveBeenCalledTimes(1);
        });
    });

    // =====================================================================
    // clear()
    // =====================================================================
    describe("clear", () => {
        test("oublie l'état en mémoire sans toucher au storage", async () => {
            const manager = new TokenManager();
            manager.userId = USER_ID;
            manager.token = "valid_token";
            manager.refreshToken = "refresh_1";
            manager.tokenExpirationDate = FUTURE();
            manager.nextValidationDate = FUTURE();

            manager.clear();

            expect(manager.token).toBeNull();
            expect(manager.refreshToken).toBeNull();
            expect(manager.userId).toBeUndefined();
            expect(chrome.storage.local.remove).not.toHaveBeenCalled();
            expect(chrome.storage.local.set).not.toHaveBeenCalled();
        });
    });

    // =====================================================================
    // isRefreshTokenRejected()
    // =====================================================================
    describe("isRefreshTokenRejected", () => {
        test.each([
            [400, { message: 'Invalid refresh token' }, true],
            [400, { error: 'invalid_grant' }, true],
            [401, { message: 'Unauthorized' }, true],
            [400, { error_description: 'Token was revoked' }, true],
            [400, null, false],
            [400, {}, false],
            [400, { message: 'missing client id' }, false],
            [429, { message: 'Invalid refresh token' }, false],
            [503, { message: 'Invalid refresh token' }, false],
        ])("status %s with %o → %s", (status, body, expected) => {
            expect(isRefreshTokenRejected(status as number, body)).toBe(expected);
        });
    });
});
