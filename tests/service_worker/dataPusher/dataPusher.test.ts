import { DataPusher } from "@src/service_worker/dataPusher.ts";
import { POLLING_INTERVAL } from "@src/constantes.ts";
import { jest, describe, beforeEach, test, expect, afterEach } from "@jest/globals";

/**
 * Cycle de vie de la boucle de polling. L'enjeu est le changement de compte :
 * une instance qu'on ne peut pas arrêter continuerait d'interroger Helix avec
 * le token du compte précédent, et d'en pousser les chaînes aux sidebars.
 *
 * `dataFormatter` est un champ public assigné au constructeur : on le remplace
 * plutôt que de mocker le module, ce qui garde le test lisible.
 */

/** Promesse dont on contrôle la résolution depuis le test. */
function deferred<T>() {
    let resolve!: (v: T) => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}

const fakeApi = { rateLimitRemaining: 800 } as any;

/** Vide la file de microtâches (plusieurs passes pour drainer les await chaînés). */
async function flushMicrotasks(passes = 15) {
    for (let i = 0; i < passes; i++) await Promise.resolve();
}

async function advance(ms: number) {
    await flushMicrotasks();
    jest.advanceTimersByTime(ms);
    await flushMicrotasks();
}

/** DataPusher dont le formatter est piloté par `updateAll`. */
function makePusher(updateAll: () => Promise<any>) {
    const sendCallback = jest.fn();
    const pusher = new DataPusher(fakeApi, sendCallback);
    pusher.dataFormatter = {
        updateAll,
        getInfotoSend: () => [[1, { channel_name: "a" }]],
    } as any;
    return { pusher, sendCallback };
}

describe("DataPusher", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    test("le constructeur ne démarre rien", async () => {
        const updateAll = jest.fn(() => Promise.resolve([]));
        const { sendCallback } = makePusher(updateAll as any);

        await advance(POLLING_INTERVAL * 3);

        expect(updateAll).not.toHaveBeenCalled();
        expect(sendCallback).not.toHaveBeenCalled();
    });

    test("getConfig() avant start() résout immédiatement (pas de promesse pendante)", async () => {
        const { pusher } = makePusher(() => Promise.resolve([]));

        await expect(pusher.getConfig()).resolves.toEqual([]);
    });

    test("start() déclenche un premier tick puis reprogramme", async () => {
        const updateAll = jest.fn(() => Promise.resolve([[1, {}]]));
        const { pusher, sendCallback } = makePusher(updateAll as any);

        pusher.start();
        await flushMicrotasks();
        expect(updateAll).toHaveBeenCalledTimes(1);
        expect(sendCallback).toHaveBeenCalledTimes(1);

        await advance(POLLING_INTERVAL);
        expect(updateAll).toHaveBeenCalledTimes(2);
    });

    test("double start() ne crée qu'une seule boucle", async () => {
        const updateAll = jest.fn(() => Promise.resolve([]));
        const { pusher } = makePusher(updateAll as any);

        pusher.start();
        pusher.start();
        await flushMicrotasks();

        expect(updateAll).toHaveBeenCalledTimes(1);
        await advance(POLLING_INTERVAL);
        expect(updateAll).toHaveBeenCalledTimes(2); // et non 4
    });

    test("stop() arrête définitivement la boucle", async () => {
        const updateAll = jest.fn(() => Promise.resolve([]));
        const { pusher } = makePusher(updateAll as any);

        pusher.start();
        await flushMicrotasks();
        expect(updateAll).toHaveBeenCalledTimes(1);

        pusher.stop();
        await advance(POLLING_INTERVAL * 5);
        expect(updateAll).toHaveBeenCalledTimes(1);

        pusher.start(); // une instance arrêtée ne redémarre pas
        await advance(POLLING_INTERVAL);
        expect(updateAll).toHaveBeenCalledTimes(1);
    });

    test("stop() PENDANT une requête en vol → le résultat est jeté", async () => {
        // clearTimeout n'annule pas la requête déjà partie : sans le garde
        // `stopped` après le await, les chaînes du compte précédent seraient
        // poussées aux sidebars du compte suivant.
        const d = deferred<any>();
        const { pusher, sendCallback } = makePusher(() => d.promise);

        pusher.start();
        await flushMicrotasks();
        pusher.stop();

        d.resolve([[1, { channel_name: "compte precedent" }]]);
        await flushMicrotasks();

        expect(sendCallback).not.toHaveBeenCalled();
    });

    test("un échec de poll ne rejette pas et la boucle continue", async () => {
        const updateAll = jest.fn()
            .mockImplementationOnce(() => Promise.reject(new Error("Helix 401")))
            .mockImplementation(() => Promise.resolve([[1, {}]]));
        const { pusher, sendCallback } = makePusher(updateAll as any);

        pusher.start();
        await flushMicrotasks();
        expect(sendCallback).not.toHaveBeenCalled();

        await advance(POLLING_INTERVAL);
        expect(updateAll).toHaveBeenCalledTimes(2);
        expect(sendCallback).toHaveBeenCalledTimes(1);
    });
});
