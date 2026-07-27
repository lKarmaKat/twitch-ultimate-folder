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
        this.port = chrome.runtime.connect(this.extensionId, {
          name: name
        });

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
                // Invalidated extension context, for one: retry later with a
                // longer delay.
                console.log(this.nm, "RECONNECT FAILED", e.message);
                this.scheduleReconnect();
            }
        }, delay);
    }

    /** Sends a message to the service worker over the already open port. */
    send(msg) {
        this.port?.postMessage(msg);
    }

    startPing() {
        // Without this clear, every reconnect left one more orphan ping still
        // calling the service worker every 5 s.
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
