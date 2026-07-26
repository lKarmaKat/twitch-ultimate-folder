import {
    portConnected,
    reconnect,
    RECONNECT_BASE_DELAY,
    RECONNECT_MAX_DELAY
} from './event.svelte.js';
import * as CST from '../constantes.js';


class PortConnector {
    port = null;
    PING_INTERVAL = 5000;
    interval;
    reconnectTimer = null;
    attempt = 0;
    connected = false;
    extensionId = "ijodiaomnnnjljemidchdifmpnnmcnlg";
    // extensionId = "pdfjeponpmleiodlfbmlhgbicfpbaoek";
    cb;
    nm;
    /** Seul le port `eventbus` pilote le bandeau de reconnexion. */
    drivesUi;
    constructor(msgCallback, name = "eventbus", ) {
        this.cb = msgCallback;
        this.nm = name;
        // Un onglet ouvre cinq ports. Sans ce filtre ils écrivent tous le même
        // booléen et la même échéance : le premier reconnecté masque le bandeau
        // alors que les autres sont encore coupés. `eventbus` est le port qui
        // porte la config et les streams, c'est lui qui fait foi.
        this.drivesUi = name === "eventbus";
        this.launchPort(msgCallback, name)
    }

    launchPort(msgCallback, name) {
        // connect() est synchrone et ne prouve rien : elle rend un Port même si
        // personne n'écoute à l'autre bout, et c'est onDisconnect qui détrompe
        // un tick plus tard. L'état « connecté » est donc établi par le premier
        // message reçu (markConnected), jamais ici.
        this.port = chrome.runtime.connect(this.extensionId, {
          name: name
        });

        this.port.onMessage.addListener((msg) => {
            this.markConnected();
            // Poignée de main du service worker : rien à traiter en aval.
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

    /** Preuve de vie : le service worker a répondu, la connexion tient. */
    markConnected() {
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        // Le prochain incident repartira du délai le plus court.
        this.attempt = 0;

        // Appelé à chaque message, pas seulement au premier : sans ce garde-fou
        // le ping serait détruit et recréé au rythme des pushes de streams.
        if (this.connected) return;
        this.connected = true;

        if (this.drivesUi) {
            portConnected.current = true;
            reconnect.nextAttemptAt = 0;
        }
        this.startPing();
    }

    /**
     * Backoff exponentiel plafonné : 2, 4, 8 puis 15 s. Un onglet en
     * arrière-plan peut rester déconnecté plusieurs minutes, inutile de sonder
     * le service worker toutes les 2 s pendant tout ce temps.
     */
    scheduleReconnect() {
        if (this.reconnectTimer !== null) return;

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
                // Contexte d'extension invalidé, par exemple : on retentera plus
                // tard, avec un délai plus long.
                console.log(this.nm, "RECONNECT FAILED", e.message);
                this.scheduleReconnect();
            }
        }, delay);
    }

    /** Envoie un message au service worker sur le port déjà ouvert. */
    send(msg) {
        this.port?.postMessage(msg);
    }

    startPing() {
        // Sans ce clear, chaque reconnexion laissait un ping orphelin de plus
        // qui continuait d'appeler le service worker toutes les 5 s.
        this.stopPing();
        let pingCallBack = () => {
            chrome.runtime.sendMessage(this.extensionId, { type: 'KEEP_ALIVE_PING' });
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
