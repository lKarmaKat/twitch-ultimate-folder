import { portConnected } from './event.js';


class PortConnector {
    portConnected = $state(false);
    port = null;
    PING_INTERVAL = 5000;
    interval;
    extensionId = "ijodiaomnnnjljemidchdifmpnnmcnlg";
    // extensionId = "pdfjeponpmleiodlfbmlhgbicfpbaoek";
    cb;
    nm;
    constructor(msgCallback, name = "eventbus", ) {
        this.cb = msgCallback;
        this.nm = name;
        this.lauchPort(msgCallback, name)
    }

    lauchPort(msgCallback, name) {
        this.port = chrome.runtime.connect(this.extensionId, {
          name: name
        });

        if (this.port) {
            portConnected.set(true);
        
            this.port.onMessage.addListener((msg) => {
                // console.log("sidebar received ", msg)
                msgCallback(msg);
            });
            this.port.onDisconnect.addListener(() => {
                console.log(this.nm, "disconnected")
                this.repollForPort()
                portConnected.update(() => false);
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
        let c = () => {
            console.log("TRYING TO RECONNECT")
            if (!this.portConnected) {
                let r = this.lauchPort(this.cb, this.nm);
                if (r) {
                    console.log("SUCCESS", r)
                    return true;
                }
                console.log("FAILED", r)

                return false
            }
        }
        setTimeout(() => {
                if (!c())
                    setTimeout(() => c(), 1000);
        }, 1000)
    }

    startPing() {
        let pingCallBack = () => {
            chrome.runtime.sendMessage(this.extensionId, { type: 'KEEP_ALIVE_PING' });
        }
        // this.interval = setInterval(pingCallBack, this.PING_INTERVAL);
    }
}

export default PortConnector;