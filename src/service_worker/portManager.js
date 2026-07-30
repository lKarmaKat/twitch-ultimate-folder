import * as CST from '../constantes.js';
import { api } from '../browserApi.js';

/**
 * Tous les ports arrivent par `onConnect`. Il exista une seconde branche
 * `onConnectExternal` tant que la sidebar tournait dans le monde principal de
 * la page : elle devait alors se connecter avec un ID d'extension, ce qui
 * exigeait externally_connectable — non supporte par Firefox. La sidebar vit
 * desormais dans le content script, donc tout est interne.
 */
class PortManager {
    ports = [];
    /** Per-port-name on-connect senders, keyed by port name. */
    onConnectHandlers = {};
    constructor(sendCurrentConfigOnConnect, sendStreamInfoOnConnect, sendCurrentAlignmentOnConnect, sendCurrentAuth, sendCurrentLocaleOnConnect, onPortMessage = (_message, _port) => {}) {
        console.log("##### Port manager constr");
        api.runtime.onConnect.addListener((port) => {
            this.ports.push(port);
            console.log("+ new connection", port);
            // Only message guaranteed whatever the port name: it proves the
            // worker is awake, which connect() alone never does.
            port.postMessage({ type: CST.PORT_READY });
            port.onMessage.addListener((message, port) => {
                console.log("+ received :", message, "from ", port);
                onPortMessage(message, port);
                this.sendMessageToTabs({message: "received"});
            });

            port.onDisconnect.addListener(() => {
                console.log("+ Port disconnected", port.sender);

                let indexToRemove = this.ports.indexOf(port);
                this.ports.splice(indexToRemove, 1);
                console.log("+ ports are now", this.ports);
            });
            if (port.name === 'eventbus') {
                sendCurrentConfigOnConnect(port);
                sendStreamInfoOnConnect(port);
            } else if (port.name === 'alignment') {
                sendCurrentAlignmentOnConnect(port)
            } else if (port.name === 'auth') {
                sendCurrentAuth(port)
            } else if (port.name === 'locale') {
                sendCurrentLocaleOnConnect(port)
            }
            this.onConnectHandlers[port.name]?.(port);
        });
    }

    /**
     * Must be called synchronously after construction: no onConnect event can
     * be dispatched before the current script turn ends.
     */
    registerOnConnect(name, handler) {
        this.onConnectHandlers[name] = handler;
    }

    sendMessageToTabs(type, message, name = "eventbus", ports = this.ports) {
        for (let port of ports) {
            if (port.name === name)
                port.postMessage({
                    "type": type,
                    "data": message instanceof Map ? Array.from(message.values()) : message
                });
        }
    }

    sendMessageToAllTabs(type, message, name = "eventbus") {
        this.sendMessageToTabs(type, message, name);
    }

    closeAllPorts() {
        for (let port of this.ports) {
            port.disconnect();
        }
    }
}

export default PortManager;
