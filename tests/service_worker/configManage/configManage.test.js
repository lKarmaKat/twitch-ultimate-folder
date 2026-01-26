import { ConfigManager } from '../../../src/service_worker/configManage'
import {jest} from '@jest/globals'
import * as t from  '../../../src/constantes'


describe('test integration getToken', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        deepClone = (obj) => JSON.parse(JSON.stringify(obj));
        chrome.storage.local = {
            get: jest.fn().mockImplementation((key, callback) => callback({ 0: deepClone(t.STARTUP_USER_CONFIGS) })),
            set: jest.fn()
        }

        // jest.mock('svelte/store', () => ({
            writable = (initialValue) => {
                let value = initialValue;
                const subscribers = new Set();
                
                return {
                subscribe: (handler) => {
                    subscribers.add(handler);
                    handler(value);
                    return () => subscribers.delete(handler);
                },
                set: (newValue) => {
                    value = newValue;
                    subscribers.forEach(handler => handler(value));
                },
                update: (updater) => {
                    value = updater(value);
                    subscribers.forEach(handler => handler(value));
                }
                };
            }
        // }));
        
        jest.resetModules();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });


    test("doit renvoyer la config pour l'utilisateur 0", async () => {
        const writ = writable();
        const configManage = new ConfigManager(null, writ);
        configManage.user = {
            id: 0,
            login: "fake_login",
            display_name: "fake_login"
        }
        const configStructure = await configManage.getConfigObjectForCurrentUser()

        expect(configStructure).toBeDefined();
        expect(configStructure.configsList.length).toBe(1);
        expect(configStructure.userId).toBe(0);
    });


    test("pas de config par défaut, renvoi la première config", async () => {
        const writ = writable();
        const c = deepClone(t.STARTUP_USER_CONFIGS);
        c.currentConfig = '';
        c.configsList[0].rootList.name = "listeCustom";
        chrome.storage.local.get = jest.fn().mockImplementation((key, callback) => callback({ 0: c }));

        const configManage = new ConfigManager(null, writ);
        configManage.user = {
            id: 0,
            login: "fake_login",
            display_name: "fake_login"
        }
        const configStructure = await configManage.getConfigObjectForCurrentUser()

        expect(configStructure).toBeDefined();
        expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
        expect(configStructure.configsList.length).toBe(1);
        expect(configStructure.userId).toBe(0);
        expect(configStructure.currentConfig).toBe("listeCustom");
    });

    test("structure utilisateur sans configs, pas de default", async () => {
        const writ = writable();
        const c = deepClone(t.STARTUP_USER_CONFIGS);
        c.userId = 123456
        c.currentConfig = '';
        c.configsList = [];
        chrome.storage.local.get = jest.fn().mockImplementation((key, callback) => {
            expect(key).toBe('123456');
            callback({ 123456: c })
        });

        const configManage = new ConfigManager(null, writ);
        configManage.user = {
            id: 123456,
            login: "fake_login",
            display_name: "fake_login"
        }

        configManage.getConfigObjectForCurrentUser(); // Check return already pending promise if exists.
        configManage.getConfigObjectForCurrentUser();
        const configStructure = await configManage.getConfigObjectForCurrentUser()
        
        expect(configStructure).toBeDefined();
        expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
        expect(configStructure.configsList.length).toBe(1);
        expect(configStructure.userId).toBe(123456);
        expect(configStructure.currentConfig).toBe("liste principale");
    });

    test("Pas d'utilisateur connecté, renvoi la config 0 (defaut)", async () => {
        const writ = writable();
        const c = deepClone(t.STARTUP_USER_CONFIGS);
        c.currentConfig = '';
        c.configsList = [];
        chrome.storage.local.get = jest.fn().mockImplementation((key, callback) => {
            expect(key).toBe('0');
            callback({ 0: c })
        });

        const configManage = new ConfigManager(null, writ);
        const configStructure = await configManage.getConfigObjectForCurrentUser()
        
        expect(configStructure).toBeDefined();
        expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
        expect(configStructure.configsList.length).toBe(1);
        expect(configStructure.userId).toBe(0);
        expect(configStructure.currentConfig).toBe("liste principale");
    });

    test("Première récupération de config, rien dans le store", async () => {
        const writ = writable();
        chrome.storage.local.get = jest.fn().mockImplementation((key, callback) => {
            expect(key).toBe('0');
            callback({ 0: {} })
        });

        const configManage = new ConfigManager(null, writ);
        const configStructure = await configManage.getConfigObjectForCurrentUser()
        
        expect(configStructure).toBeDefined();
        expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
        expect(configStructure.configsList.length).toBe(1);
        expect(configStructure.userId).toBe(0);
        expect(configStructure.currentConfig).toBe("liste principale");
    });


    test("Pas d'utilisateur, save config par défaut", async () => {
        const writ = writable();
        const configManage = new ConfigManager(null, writ);
        
        chrome.storage.local.get = jest.fn().mockImplementation((key, callback) => {
            expect(key).toBe('0');
            callback({})
        });
        
        chrome.storage.local.set = jest.fn().mockImplementation(data => {
            expect(data[0].userId).toBe(0);
            expect(data[0].currentConfig).toBe('liste principale');
        })
        
        let configToSave = deepClone(t.STARTUP_CONF);
        configManage.saveConfig(configToSave);
    });

    test("Utilisateur connecté, save config par défaut", async () => {
        const writ = writable();
        const configManage = new ConfigManager(null, writ);

        const c = deepClone(t.STARTUP_USER_CONFIGS);
        chrome.storage.local.get = jest.fn().mockImplementation((key, callback) => {
            expect(key).toBe('0');
            callback({ 0: c })
        });
        
        chrome.storage.local.set = jest.fn().mockImplementation(data => {
            expect(data[0].userId).toBe(0);
            expect(data[0].configsList.length).toBe(2);
            expect(data[0].configsList[1].rootList.name).toBe("custom");
        })
        
        let configToSave = deepClone(t.STARTUP_CONF);
        configToSave.rootList.name = "custom";
        configManage.saveConfig(configToSave);
    });

    test("Undefined config isn't saved", async () => {
        const writ = writable();
        const configManage = new ConfigManager(null, writ);

        configManage.saveConfig();

        expect(chrome.storage.local.get).not.toHaveBeenCalled();
        expect(chrome.storage.local.set).not.toHaveBeenCalled();

    });
});