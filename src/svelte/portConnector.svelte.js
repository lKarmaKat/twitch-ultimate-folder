import { portConnected } from './event.svelte.js';


class PortConnector {
    port = null;
    PING_INTERVAL = 5000;
    interval;
    reconnectInterval = null;
    extensionId = "ijodiaomnnnjljemidchdifmpnnmcnlg";
    // extensionId = "pdfjeponpmleiodlfbmlhgbicfpbaoek";
    cb;
    nm;
    constructor(msgCallback, name = "eventbus", ) {
        this.cb = msgCallback;
        this.nm = name;
        this.launchPort(msgCallback, name)
    }

    launchPort(msgCallback, name) {
        this.port = chrome.runtime.connect(this.extensionId, {
          name: name
        });

        if (this.port) {
            portConnected.current = true;
        
            this.port.onMessage.addListener((msg) => {
                // console.log("sidebar received ", msg)
                msgCallback(msg);
            });
            this.port.onDisconnect.addListener(() => {
                console.log(this.nm, "disconnected")
                this.repollForPort()
                portConnected.current = false;
                // this.port = undefined;
            });
            this.startPing();
            console.log(name, this.port)
            return true
        } else {
            return false;
        }
    }

    repollForPort() {
        if (this.reconnectInterval !== null) return;

        this.reconnectInterval = setInterval(() => {
            console.log(this.nm, "TRYING TO RECONNECT");
            try {
                const success = this.launchPort(this.cb, this.nm);
                if (success) {
                    console.log(this.nm, "RECONNECT SUCCESS");
                    portConnected.current = true;
                    clearInterval(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
            } catch (e) {
                console.log(this.nm, "RECONNECT FAILED", e.message);
            }
        }, 10000);
    }

    startPing() {
        let pingCallBack = () => {
            chrome.runtime.sendMessage(this.extensionId, { type: 'KEEP_ALIVE_PING' });
        }
        // this.interval = setInterval(pingCallBack, this.PING_INTERVAL);
    }
}

export default PortConnector;