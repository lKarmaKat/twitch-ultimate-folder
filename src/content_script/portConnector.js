class PortConnector {
    portConnected = false;
    port = null;
    PING_INTERVAL = 5000;
    interval;
    extensionId = "ijodiaomnnnjljemidchdifmpnnmcnlg";
    // extensionId = "pdfjeponpmleiodlfbmlhgbicfpbaoek";

    constructor(msgCallback, name = "eventbus") {
        // console.log("port constructor")
        this.port = chrome.runtime.connect(this.extensionId, {
          name: name
        });

        if (this.port) this.portConnected = true;
        
        this.port.onMessage.addListener((msg) => {
            msgCallback(msg);
        });
        this.port.onDisconnect.addListener(() => {
            this.portConnected = false;
        });

        this.startPing();
    }

    startPing() {
        let pingCallBack = () => {
            chrome.runtime.sendMessage(this.extensionId, { type: 'KEEP_ALIVE_PING' });
        }
        this.interval = setInterval(pingCallBack, this.PING_INTERVAL);
    }
}

export default PortConnector;