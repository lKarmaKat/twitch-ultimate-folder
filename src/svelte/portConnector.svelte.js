import {
    portConnected,
    contextLost,
    reconnect,
    RECONNECT_BASE_DELAY,
    RECONNECT_MAX_DELAY
} from './event.svelte.js';
import * as CST from '../constantes.js';
import { api } from '../browserApi.js';

/**
 * `runtime.id` passe a undefined des que le contexte d'extension du content
 * script est invalide (extension rechargee, mise a jour ou desactivee). Ce
 * n'est PAS lie a la veille du service worker : l'objet runtime injecte reste
 * intact tant que l'extension vit, donc pas de faux positif sur une simple
 * mise en veille.
 */
function contextAlive() {
    try {
        return !!api.runtime?.id;
    } catch {
        // Firefox jette a l'acces plutot que de renvoyer undefined.
        return false;
    }
}


class PortConnector {
    port = null;
    PING_INTERVAL = 5000;
    interval;
    reconnectTimer = null;
    attempt = 0;
    connected = false;
    cb;
    nm;
    /** Only the `eventbus` port drives the reconnect banner. */
    drivesUi;
    constructor(msgCallback, name = "eventbus", ) {
        this.cb = msgCallback;
        this.nm = name;
        // A tab opens five ports; without this filter the first one to
        // reconnect would hide the banner while the others are still down.
        this.drivesUi = name === "eventbus";
        this.launchPort(msgCallback, name)
    }

    launchPort(msgCallback, name) {
        // connect() is synchronous and proves nothing: it returns a Port even
        // with nobody listening. Only the first message means "connected".
        // Pas d'ID d'extension : tous les appelants (content script, iframe de
        // config, page d'aide) sont internes, donc onConnect suffit. Passer un
        // ID passerait par onConnectExternal, qui exige externally_connectable
        // — non supporte par Firefox.
        this.port = api.runtime.connect({ name: name });

        this.port.onMessage.addListener((msg) => {
            this.markConnected();
            // Service worker handshake: nothing to handle downstream.
            if (msg?.type === CST.PORT_READY) return;
            msgCallback(msg);
        });

        this.port.onDisconnect.addListener(() => {
            console.log(this.nm, "disconnected")
            this.connected = false;
            this.stopPing();
            if (this.drivesUi) portConnected.current = false;
            this.scheduleReconnect();
        });
    }

    /** Proof of life: the service worker answered, the connection holds. */
    markConnected() {
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        // The next outage restarts from the shortest delay.
        this.attempt = 0;

        // Called on every message, not just the first: without this guard the
        // ping would be torn down and rebuilt at the rate of stream pushes.
        if (this.connected) return;
        this.connected = true;

        if (this.drivesUi) {
            portConnected.current = true;
            reconnect.nextAttemptAt = 0;
        }
        this.startPing();
    }

    /**
     * Capped exponential backoff: 2, 4, 8 then 15 s. A background tab can stay
     * disconnected for minutes; no point polling every 2 s throughout.
     */
    scheduleReconnect() {
        if (this.reconnectTimer !== null) return;
        // Rien a attendre : un contexte invalide ne revient jamais, et le
        // backoff tournerait a vide toutes les 15 s pour l'eternite.
        if (!contextAlive()) return this.giveUp();

        const delay = Math.min(RECONNECT_BASE_DELAY * 2 ** this.attempt, RECONNECT_MAX_DELAY);
        if (this.drivesUi) {
            reconnect.delay = delay;
            reconnect.nextAttemptAt = Date.now() + delay;
        }

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.attempt++;
            console.log(this.nm, "TRYING TO RECONNECT");
            try {
                this.launchPort(this.cb, this.nm);
            } catch (e) {
                console.log(this.nm, "RECONNECT FAILED", e.message);
                // Second filet : le contexte peut mourir entre la planification
                // et le tir du timer.
                if (!contextAlive()) return this.giveUp();
                // Panne passagere : on retente, avec un delai plus long.
                this.scheduleReconnect();
            }
        }, delay);
    }

    /**
     * Fin de partie : plus de ping, plus de timer, et l'UI bascule sur "recharge
     * la page" — la seule chose qui repare un contexte invalide.
     */
    giveUp() {
        this.stopPing();
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        console.log(this.nm, "CONTEXT LOST, giving up");
        if (this.drivesUi) {
            contextLost.current = true;
            reconnect.nextAttemptAt = 0;
        }
    }

    /** Sends a message to the service worker over the already open port. */
    send(msg) {
        try {
            this.port?.postMessage(msg);
        } catch (e) {
            // Port mort : le clic sur l'engrenage ne doit pas remonter une
            // exception, la banniere dit deja quoi faire.
            console.log(this.nm, "SEND FAILED", e.message);
        }
    }

    startPing() {
        // Without this clear, every reconnect left one more orphan ping still
        // calling the service worker every 5 s.
        this.stopPing();
        let pingCallBack = () => {
            api.runtime.sendMessage({ type: 'KEEP_ALIVE_PING' });
        }
        this.interval = setInterval(pingCallBack, this.PING_INTERVAL);
    }

    stopPing() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }
}

export default PortConnector;
