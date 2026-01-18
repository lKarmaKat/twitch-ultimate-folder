import { ConfigManager } from '../../../src/service_worker/configManage'
import {jest} from '@jest/globals'
import * as t from  '../../../src/constantes'


describe('test integration getToken', () => {

    beforeEach(() => {
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
        expect(configStructure.configsList.length).toBe(1);
        expect(configStructure.userId).toBe(0);
        expect(configStructure.currentConfig).toBe("listeCustom");
    });

    test("structure utilisateur sans configs, pas de default", async () => {
        const writ = writable();
        const c = deepClone(t.STARTUP_USER_CONFIGS);
        c.currentConfig = '';
        c.configsList = [];
        chrome.storage.local.get = jest.fn().mockImplementation((key, callback) => callback({ 0: c }));

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
        expect(configStructure.currentConfig).toBe("liste principale");
    });
});