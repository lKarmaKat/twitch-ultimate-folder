import { ConfigManager } from "@src/service_worker/configManage.ts";
import * as CST from "@src/constantes.ts";
import { jest, describe, beforeEach, test, expect, afterEach } from "@jest/globals";

/**
 * Tests des SEULES méthodes publiques de ConfigManager :
 *   - initConfigWithUser(userId)
 *   - getConfigObjectForCurrentUser()
 *   - saveConfig(configToSave)
 *
 * `findConfigById` et le constructeur ne sont pas testés directement (non appelés
 * depuis l'extérieur ; couverts indirectement).
 *
 * Dépendance externe mockée : chrome.storage.local (API basée sur des Promises).
 */

/** Clone profond : le code mute `userStructure` en place, il faut isoler chaque test. */
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

/** chrome.storage.local.get résout avec `record`. */
function mockStorageGet(record: Record<string, unknown>) {
    (chrome.storage.local.get as unknown as jest.Mock).mockResolvedValue(record);
}

/** Nouvel instance ; le twitchApi n'est pas utilisé par les 3 méthodes testées. */
function makeManager() {
    return new ConfigManager(null as any);
}

describe("ConfigManager", () => {
    beforeEach(() => {
        chrome.storage.local = {
            get: jest.fn(),
            set: jest.fn().mockResolvedValue(undefined),
            remove: jest.fn(),
        } as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // =====================================================================
    // initConfigWithUser()
    // =====================================================================
    describe("initConfigWithUser", () => {
        test("positionne userId → getConfigObjectForCurrentUser procède réellement", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(42);
            mockStorageGet({}); // storage vide → config de démarrage

            const result = await manager.getConfigObjectForCurrentUser();

            expect(chrome.storage.local.get).toHaveBeenCalledWith(CST.configKey(42));
            expect(result).not.toBeNull();
            expect(result!.userId).toBe(42);
        });
    });

    // =====================================================================
    // getConfigObjectForCurrentUser()
    // =====================================================================
    describe("getConfigObjectForCurrentUser", () => {
        test("aucun user (userId null) → résout null, pas d'accès au storage", async () => {
            const manager = makeManager();

            const result = await manager.getConfigObjectForCurrentUser();

            expect(result).toBeNull();
            expect(chrome.storage.local.get).not.toHaveBeenCalled();
        });

        test("userId === 0 (falsy) → résout null également (comportement de bord)", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(0);

            const result = await manager.getConfigObjectForCurrentUser();

            expect(result).toBeNull();
            expect(chrome.storage.local.get).not.toHaveBeenCalled();
        });

        test("structure valide avec currentConfig → renvoyée telle quelle, userConfigs renseignée", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(42);
            const stored = deepClone(CST.STARTUP_USER_CONFIGS);
            stored.userId = 42;
            stored.currentConfig = "maListe";
            mockStorageGet({ [CST.configKey(42)]: stored });

            const result = await manager.getConfigObjectForCurrentUser();

            expect(chrome.storage.local.get).toHaveBeenCalledWith(CST.configKey(42));
            expect(result!.currentConfig).toBe("maListe");
            expect(result!.configsList.length).toBe(1);
            expect(manager.userConfigs).toBe(result);
        });

        test("structure sans currentConfig et configsList vide → currentConfig = NEW_LIST.name + STARTUP_CONF", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(42);
            const stored = deepClone(CST.STARTUP_USER_CONFIGS);
            (stored as any).currentConfig = "";
            stored.configsList = [];
            mockStorageGet({ [CST.configKey(42)]: stored });

            const result = await manager.getConfigObjectForCurrentUser();

            expect(result!.currentConfig).toBe(CST.NEW_LIST.name);
            expect(result!.configsList.length).toBe(1);
            expect(result!.configsList[0].rootList.name).toBe(CST.STARTUP_CONF.rootList.name);
        });

        test("structure sans currentConfig, configsList non vide → currentConfig = premier config", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(42);
            const stored = deepClone(CST.STARTUP_USER_CONFIGS);
            (stored as any).currentConfig = "";
            stored.configsList[0].rootList.name = "listeCustom";
            mockStorageGet({ [CST.configKey(42)]: stored });

            const result = await manager.getConfigObjectForCurrentUser();

            expect(result!.currentConfig).toBe("listeCustom");
            expect(result!.configsList.length).toBe(1);
        });

        test("storage vide (objet vide) → config de démarrage dérivée de STARTUP_USER_CONFIGS", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(999);
            mockStorageGet({ "999": {} });

            const result = await manager.getConfigObjectForCurrentUser();

            expect(result!.userId).toBe(999);
            expect(result!.currentConfig).toBe("default");
            expect(result!.configsList.length).toBe(1);
            expect(manager.userConfigs).toBe(result);
        });

        test("aucune entrée dans le storage (undefined) → config de démarrage", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(999);
            mockStorageGet({}); // data["999"] === undefined

            const result = await manager.getConfigObjectForCurrentUser();

            expect(result!.userId).toBe(999);
            expect(result!.currentConfig).toBe("default");
            expect(result!.configsList.length).toBe(1);
        });

        test("appels concurrents → userConfigsPromise partagée, un seul get", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(42);
            mockStorageGet({}); // config de démarrage

            const [a, b] = await Promise.all([
                manager.getConfigObjectForCurrentUser(),
                manager.getConfigObjectForCurrentUser(),
            ]);

            expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
            expect(a).toBe(b);
        });

        test("userConfigsPromise réinitialisée après résolution → 2e appel séquentiel refait un get", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(42);
            mockStorageGet({});

            await manager.getConfigObjectForCurrentUser();
            await manager.getConfigObjectForCurrentUser();

            expect(chrome.storage.local.get).toHaveBeenCalledTimes(2);
        });
    });

    // =====================================================================
    // saveConfig()
    // =====================================================================
    describe("saveConfig", () => {
        test("config falsy (undefined) → throw 'No config to save', ni get ni set", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(42);

            await expect(manager.saveConfig(undefined as any)).rejects.toThrow("No config to save");
            expect(chrome.storage.local.get).not.toHaveBeenCalled();
            expect(chrome.storage.local.set).not.toHaveBeenCalled();
        });

        test("pas d'user (userId null) → throw 'No user connected'", async () => {
            const manager = makeManager();
            const configToSave = deepClone(CST.STARTUP_CONF);

            await expect(manager.saveConfig(configToSave)).rejects.toThrow(
                "No user connected, cannot save config"
            );
            expect(chrome.storage.local.get).not.toHaveBeenCalled();
        });

        test("userId === 0 (falsy) → throw 'No user connected' (comportement de bord)", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(0);
            const configToSave = deepClone(CST.STARTUP_CONF);

            await expect(manager.saveConfig(configToSave)).rejects.toThrow(
                "No user connected, cannot save config"
            );
        });

        test("structure existante, nom déjà présent → remplace à l'index (length inchangée)", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(42);
            const stored = deepClone(CST.STARTUP_USER_CONFIGS);
            stored.userId = 42;
            mockStorageGet({ [CST.configKey(42)]: stored });

            const configToSave = deepClone(CST.STARTUP_CONF); // même rootList.name === 'default'
            configToSave.rootList.items = ["remplacé"] as any;

            const result = await manager.saveConfig(configToSave);

            expect(result.configsList.length).toBe(1); // remplacement, pas d'ajout
            expect(result.configsList[0].rootList.items).toEqual(["remplacé"]);
            expect(chrome.storage.local.set).toHaveBeenCalledWith({ [CST.configKey(42)]: result });
        });

        test("structure existante, nouveau nom → push (length +1)", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(42);
            const stored = deepClone(CST.STARTUP_USER_CONFIGS);
            stored.userId = 42;
            mockStorageGet({ [CST.configKey(42)]: stored });

            const configToSave = deepClone(CST.STARTUP_CONF);
            configToSave.rootList.name = "custom";

            const result = await manager.saveConfig(configToSave);

            expect(result.configsList.length).toBe(2);
            expect(result.configsList[1].rootList.name).toBe("custom");
            expect(chrome.storage.local.set).toHaveBeenCalledWith({ [CST.configKey(42)]: result });
        });

        test("storage vide → crée une nouvelle structure (currentConfig = nom sauvegardé)", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(42);
            mockStorageGet({}); // aucune structure

            const configToSave = deepClone(CST.STARTUP_CONF);
            configToSave.rootList.name = "custom";

            const result = await manager.saveConfig(configToSave);

            expect(result.userId).toBe(42);
            expect(result.currentConfig).toBe("custom");
            expect(result.configsList).toEqual([configToSave]);
            expect(chrome.storage.local.set).toHaveBeenCalledWith({ [CST.configKey(42)]: result });
        });

        test("résout la userStructure finale et met à jour this.userConfigs", async () => {
            const manager = makeManager();
            manager.initConfigWithUser(42);
            const stored = deepClone(CST.STARTUP_USER_CONFIGS);
            stored.userId = 42;
            mockStorageGet({ [CST.configKey(42)]: stored });

            const result = await manager.saveConfig(deepClone(CST.STARTUP_CONF));

            expect(manager.userConfigs).toBe(result);
        });
    });
});
