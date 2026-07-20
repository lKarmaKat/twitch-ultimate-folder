import * as CST from "@src/constantes.ts";
import { describe, test, expect } from "@jest/globals";

/**
 * Les templates de configuration étaient exportés comme objets mutables partagés
 * (`NEW_LIST`, `STARTUP_CONF`). Les affecter sans cloner faisait que toute mutation
 * de l'appelant — renommage, push d'items, case de comportement — corrompait le
 * défaut de toutes les listes créées ensuite, et la corruption était persistée en
 * storage via saveConfig.
 *
 * Invariant : on obtient un objet frais par factory, et les constants exportés
 * sont gelés en profondeur pour qu'un site oublié lève au lieu de corrompre.
 */
describe("templates de configuration", () => {
    test("createNewList() renvoie un objet distinct à chaque appel", () => {
        const a = CST.createNewList();
        const b = CST.createNewList();

        expect(a).not.toBe(b);
        expect(a).toEqual(b);
        // structures imbriquées incluses : c'est là que se logeait le partage
        expect(a.items).not.toBe(b.items);
        expect(a.behavior).not.toBe(b.behavior);
        expect(a.style).not.toBe(b.style);
        expect(a.type).not.toBe(b.type);
    });

    test("muter le résultat d'une factory n'affecte pas les appels suivants", () => {
        const first = CST.createNewList();
        first.name = "list 1";
        first.id = "list1";
        first.items.push({ channel_id: "42", id: 42 });
        (first.behavior as any)[CST.SHOW_EVEN_IF_NO_LIVE] = true;

        const second = CST.createNewList();
        expect(second.name).toBe("default");
        expect(second.id).toBe("node1");
        expect(second.items).toEqual([]);
        expect((second.behavior as any)[CST.SHOW_EVEN_IF_NO_LIVE]).toBe(false);
    });

    test("createStartupConf() ne partage pas sa rootList entre appels", () => {
        const a = CST.createStartupConf();
        const b = CST.createStartupConf();

        expect(a.rootList).not.toBe(b.rootList);

        a.rootList.name = "renommée";
        a.rootList.items.push({ channel_id: "42", id: 42 });

        expect(b.rootList.name).toBe("default");
        expect(b.rootList.items).toEqual([]);
    });

    test("createStartupUserConfigs() ne partage ni son tableau ni ses configs", () => {
        const a = CST.createStartupUserConfigs(1);
        const b = CST.createStartupUserConfigs(2);

        expect(a.configsList).not.toBe(b.configsList);
        expect(a.configsList[0]).not.toBe(b.configsList[0]);
        expect(a.userId).toBe(1);
        expect(b.userId).toBe(2);
    });

    test("les constants exportés sont gelés en profondeur", () => {
        expect(Object.isFrozen(CST.NEW_LIST)).toBe(true);
        expect(Object.isFrozen(CST.NEW_LIST.items)).toBe(true);
        expect(Object.isFrozen(CST.NEW_LIST.behavior)).toBe(true);
        expect(Object.isFrozen(CST.STARTUP_CONF)).toBe(true);
        expect(Object.isFrozen(CST.STARTUP_CONF.rootList)).toBe(true);
        expect(Object.isFrozen(CST.STARTUP_USER_CONFIGS)).toBe(true);
        expect(Object.isFrozen(CST.STARTUP_USER_CONFIGS.configsList)).toBe(true);
    });

    test("muter un constant exporté lève au lieu de corrompre silencieusement", () => {
        expect(() => { (CST.NEW_LIST as any).name = "list 1"; }).toThrow(TypeError);
        expect(() => { (CST.NEW_LIST.items as any).push({}); }).toThrow(TypeError);
        expect(() => { (CST.STARTUP_CONF.rootList as any).name = "list 1"; }).toThrow(TypeError);
    });

    test("les constants n'ont pas dérivé de leur valeur par défaut", () => {
        expect(CST.NEW_LIST.name).toBe("default");
        expect(CST.NEW_LIST.id).toBe("node1");
        expect(CST.NEW_LIST.items).toEqual([]);
        expect(CST.STARTUP_CONF.rootList.name).toBe("default");
    });
});
