import * as CST from '../constantes.js';

class PortManager {
    ports = [];
    externalPorts = [];
    constructor(sendCurrentConfigOnConnect, sendStreamInfoOnConnect, sendCurrentThemeOnConnect, sendCurrentAlignmentOnConnect, sendCurrentAuth, sendCurrentLocaleOnConnect, onPortMessage = (_message, _port) => {}) {
        console.log("##### Port manager constr");
        chrome.runtime.onConnect.addListener((port) => {
            this.ports.push(port);
            console.log("+ new connection", port);
            // Seul message garanti quel que soit le nom du port : c'est lui qui
            // atteste au client que le service worker est réveillé. Sans ça il
            // ne peut pas distinguer un port vivant d'un port mort-né, car
            // chrome.runtime.connect() réussit dans les deux cas.
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
            } else if (port.name === 'theme') {
                sendCurrentThemeOnConnect(port);
            } else if (port.name === 'alignment') {
                sendCurrentAlignmentOnConnect(port)
            } else if (port.name === 'auth') {
                sendCurrentAuth(port)
            } else if (port.name === 'locale') {
                sendCurrentLocaleOnConnect(port)
            }
        });

        chrome.runtime.onConnectExternal.addListener((port) => {
                this.externalPorts.push(port);
                console.log("+ external new connection  port", port);
                // Même poignée de main que pour les ports internes : la sidebar
                // passe par ici (script du monde principal de la page Twitch).
                port.postMessage({ type: CST.PORT_READY });
                port.onMessage.addListener((message, port) => {
                    console.log("+ received :", message, "from ", port);
                    onPortMessage(message, port);
                    this.sendMessageToTabs({message: "received"});
                });
                
                port.onDisconnect.addListener(() => {
                    console.log("- external Port disconnected port", port.sender);
                    
                    let indexToRemove = this.externalPorts.indexOf(port);
                    this.externalPorts.splice(indexToRemove, 1);
                    console.log("external ports are now", this.externalPorts);
                });
            if (port.name === "eventbus") {
                // setTimeout(() => {

                    sendCurrentConfigOnConnect(port);
                    sendStreamInfoOnConnect(port);
                // }, 1200)
            } else if (port.name === 'theme') {
                sendCurrentThemeOnConnect(port);
            }  else if (port.name === 'alignment') {
                sendCurrentAlignmentOnConnect(port)
            } else if (port.name === 'auth') {
                sendCurrentAuth(port)
            } else if (port.name === 'locale') {
                sendCurrentLocaleOnConnect(port)
            }
            // setTimeout(() => {
            //     let index = this.externalPorts.findIndex(po => po === port);
            //     port.disconnect()
            //     this.externalPorts.splice(index, 1);
            //     console.log("disconnected", this.externalPorts)
            // }, 2000)
        });
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
        this.sendMessageToTabs(type, message, name, this.externalPorts);
    }

    closeAllPorts() {
        for (let port of [...this.ports, ...this.externalPorts]) {
            port.disconnect();
        }
    }
}

export default PortManager;
