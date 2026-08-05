import { DataPusher } from "@src/service_worker/dataPusher.ts";
import { HttpError, wrapError } from "@src/service_worker/errors.ts";
import { MAX_BACKOFF_INTERVAL, POLLING_INTERVAL } from "@src/constantes.ts";
import { api } from "@src/browserApi.ts";
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

/** Un onglet Twitch sélectionné dans une fenêtre non minimisée. */
function setVisibleConsumer(tabs: any[], windowState = "normal") {
    (api as any).tabs = { query: jest.fn(() => Promise.resolve(tabs)) };
    (api as any).windows = { get: jest.fn(() => Promise.resolve({ state: windowState })) };
}

describe("DataPusher", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        setVisibleConsumer([{ windowId: 1 }]);
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

        await advance(POLLING_INTERVAL * 2); // premier palier de backoff
        expect(updateAll).toHaveBeenCalledTimes(2);
        expect(sendCallback).toHaveBeenCalledTimes(1);
    });

    test("les échecs consécutifs espacent les tentatives puis plafonnent", async () => {
        const updateAll = jest.fn(() => Promise.reject(new Error("réseau coupé")));
        const { pusher } = makePusher(updateAll as any);

        pusher.start();
        await flushMicrotasks();
        expect(updateAll).toHaveBeenCalledTimes(1);

        await advance(POLLING_INTERVAL); // 6 s : trop tôt, le backoff est à 12 s
        expect(updateAll).toHaveBeenCalledTimes(1);

        await advance(POLLING_INTERVAL); // 12 s cumulées
        expect(updateAll).toHaveBeenCalledTimes(2);

        await advance(POLLING_INTERVAL * 4); // 24 s
        expect(updateAll).toHaveBeenCalledTimes(3);

        await advance(POLLING_INTERVAL * 8); // 48 s
        expect(updateAll).toHaveBeenCalledTimes(4);

        await advance(MAX_BACKOFF_INTERVAL); // plafonné, et non 96 s
        expect(updateAll).toHaveBeenCalledTimes(5);
    });

    test("un succès remet le backoff à zéro", async () => {
        const updateAll = jest.fn()
            .mockImplementationOnce(() => Promise.reject(new Error("boom")))
            .mockImplementation(() => Promise.resolve([]));
        const { pusher } = makePusher(updateAll as any);

        pusher.start();
        await advance(POLLING_INTERVAL * 2);
        expect(updateAll).toHaveBeenCalledTimes(2); // le succès

        await advance(POLLING_INTERVAL); // cadence nominale retrouvée
        expect(updateAll).toHaveBeenCalledTimes(3);
    });

    test("un 429 impose le délai du serveur, même enveloppé", async () => {
        const updateAll = jest.fn(() => Promise.reject(
            wrapError("TwitchApi.getUserFollowedLiveStream failed",
                new HttpError(429, 30000, "https://api.twitch.tv/helix/streams/followed"))
        ));
        const { pusher } = makePusher(updateAll as any);

        pusher.start();
        await flushMicrotasks();

        await advance(12000); // le backoff exponentiel aurait suffi ici
        expect(updateAll).toHaveBeenCalledTimes(1);

        await advance(18000); // 30 s cumulées : le Retry-After du serveur
        expect(updateAll).toHaveBeenCalledTimes(2);
    });

    test("sans onglet Twitch visible, plus aucun appel réseau", async () => {
        const updateAll = jest.fn(() => Promise.resolve([]));
        const { pusher } = makePusher(updateAll as any);

        pusher.start();
        await flushMicrotasks();
        expect(updateAll).toHaveBeenCalledTimes(1); // le premier tick passe toujours

        setVisibleConsumer([]);
        await advance(POLLING_INTERVAL * 5);
        expect(updateAll).toHaveBeenCalledTimes(1);

        setVisibleConsumer([{ windowId: 1 }]); // retour sur l'onglet
        await advance(POLLING_INTERVAL);
        expect(updateAll).toHaveBeenCalledTimes(2);
    });

    test("une fenêtre minimisée ne compte pas comme consommateur", async () => {
        const updateAll = jest.fn(() => Promise.resolve([]));
        const { pusher } = makePusher(updateAll as any);

        pusher.start();
        await flushMicrotasks();

        setVisibleConsumer([{ windowId: 1 }], "minimized");
        await advance(POLLING_INTERVAL * 5);
        expect(updateAll).toHaveBeenCalledTimes(1);
    });

    test("le premier tick ignore la visibilité, pour servir getConfig()", async () => {
        // Un onglet qui s'ouvre dans une fenêtre en arrière-plan doit quand même
        // recevoir ses chaînes : sinon la sidebar reste vide indéfiniment.
        setVisibleConsumer([]);
        const updateAll = jest.fn(() => Promise.resolve([]));
        const { pusher } = makePusher(updateAll as any);

        pusher.start();
        await flushMicrotasks();

        expect(updateAll).toHaveBeenCalledTimes(1);
        await expect(pusher.getConfig()).resolves.toEqual([[1, { channel_name: "a" }]]);
    });
});
