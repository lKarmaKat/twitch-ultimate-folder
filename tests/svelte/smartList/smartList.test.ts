import { channelMatchesSource, getSmartMatchedChannels, getSourceGames, mirrorLegacyGame } from "@src/svelte/smartList.ts";
import * as CST from "@src/constantes.ts";
import { describe, test, expect } from "@jest/globals";

const liveChannel = (over: Partial<any> = {}) => ({
    channel_id: 1,
    isLive: true,
    game_id: "509658",
    game_name: "Just Chatting",
    language: "fr",
    started_at: new Date(Date.now() - 5 * 60000).toISOString(),
    ...over
});

describe("getSourceGames", () => {
    test("regle multi-categories : renvoie le cycle tel quel", () => {
        const games = [{ id: "509658", name: "Just Chatting" }, { id: "32982", name: "GTA V" }];
        expect(getSourceGames({ kind: CST.SOURCE_KIND_GAME, games })).toEqual(games);
    });

    test("regle d'avant le cycle : la categorie inline devient un cycle d'un element", () => {
        const rule = { kind: CST.SOURCE_KIND_GAME, game_id: "509658", game_name: "Just Chatting" };
        expect(getSourceGames(rule)).toEqual([{ id: "509658", name: "Just Chatting" }]);
    });

    test("regle vide : aucun element", () => {
        expect(getSourceGames({ kind: CST.SOURCE_KIND_GAME, games: [], game_id: null })).toEqual([]);
        expect(getSourceGames(undefined)).toEqual([]);
    });
});

describe("mirrorLegacyGame", () => {
    test("recopie la premiere categorie du cycle sur les champs historiques", () => {
        const source: any = { kind: CST.SOURCE_KIND_GAME, games: [{ id: "32982", name: "GTA V" }, { id: "509658", name: "Just Chatting" }] };
        mirrorLegacyGame(source);
        expect(source.game_id).toBe("32982");
        expect(source.game_name).toBe("GTA V");
    });

    test("cycle vide : les champs historiques sont remis a null", () => {
        const source: any = { kind: CST.SOURCE_KIND_GAME, games: [], game_id: "32982", game_name: "GTA V" };
        mirrorLegacyGame(source);
        expect(source.game_id).toBeNull();
        expect(source.game_name).toBeNull();
    });
});

describe("channelMatchesSource", () => {
    test("par jeu : matche sur l'id, pas sur le nom", () => {
        const rule = { kind: CST.SOURCE_KIND_GAME, game_id: "509658" };
        expect(channelMatchesSource(liveChannel(), rule)).toBe(true);
        expect(channelMatchesSource(liveChannel({ game_id: "12345" }), rule)).toBe(false);
    });

    test("par jeu : matche n'importe quelle categorie du cycle", () => {
        const rule = { kind: CST.SOURCE_KIND_GAME, games: [{ id: "509658" }, { id: "32982" }] };
        expect(channelMatchesSource(liveChannel(), rule)).toBe(true);
        expect(channelMatchesSource(liveChannel({ game_id: "32982" }), rule)).toBe(true);
        expect(channelMatchesSource(liveChannel({ game_id: "12345" }), rule)).toBe(false);
    });

    test("par jeu : une chaine hors ligne ne matche jamais", () => {
        const rule = { kind: CST.SOURCE_KIND_GAME, game_id: "509658" };
        expect(channelMatchesSource(liveChannel({ isLive: false }), rule)).toBe(false);
    });

    test("par langue : matche sur le code exact", () => {
        const rule = { kind: CST.SOURCE_KIND_LANGUAGE, language: "fr" };
        expect(channelMatchesSource(liveChannel(), rule)).toBe(true);
        expect(channelMatchesSource(liveChannel({ language: "en" }), rule)).toBe(false);
    });

    test("vient de commencer : dans la fenetre", () => {
        const rule = { kind: CST.SOURCE_KIND_FRESH, freshMinutes: 10 };
        expect(channelMatchesSource(liveChannel(), rule)).toBe(true);
    });

    test("vient de commencer : hors fenetre", () => {
        const rule = { kind: CST.SOURCE_KIND_FRESH, freshMinutes: 10 };
        const old = liveChannel({ started_at: new Date(Date.now() - 30 * 60000).toISOString() });
        expect(channelMatchesSource(old, rule)).toBe(false);
    });

    test("manuelle : ne matche jamais (pas une regle)", () => {
        expect(channelMatchesSource(liveChannel(), { kind: CST.SOURCE_KIND_MANUAL })).toBe(false);
    });
});

describe("getSmartMatchedChannels", () => {
    function makeConfigManager(source: any, channelsPickRef: any[]) {
        return {
            selectedConfig: { list1: { source } },
            channelsPickRef
        };
    }

    test("liste manuelle : aucun match, meme si un channel correspondrait", () => {
        const cm = makeConfigManager({ kind: CST.SOURCE_KIND_MANUAL }, [liveChannel()]);
        expect(getSmartMatchedChannels(cm, "list1")).toEqual([]);
    });

    test("ignore le pseudo-item 'all other channels' (id negatif)", () => {
        const cm = makeConfigManager(
            { kind: CST.SOURCE_KIND_GAME, game_id: "509658" },
            [liveChannel(), liveChannel({ channel_id: CST.ALL_OTHER_CHANNELS, game_id: "509658" })]
        );
        const matched = getSmartMatchedChannels(cm, "list1");
        expect(matched).toHaveLength(1);
        expect(matched[0].channel_id).toBe(1);
    });

    test("liste sans source : aucun match (retro-compatibilite)", () => {
        const cm = { selectedConfig: { list1: {} }, channelsPickRef: [liveChannel()] };
        expect(getSmartMatchedChannels(cm, "list1")).toEqual([]);
    });

    test("sans categorie ciblee : l'union du cycle, ce que regarde la visibilite", () => {
        const cm = makeConfigManager(
            { kind: CST.SOURCE_KIND_GAME, games: [{ id: "509658" }, { id: "32982" }] },
            [liveChannel(), liveChannel({ channel_id: 2, game_id: "32982" })]
        );
        expect(getSmartMatchedChannels(cm, "list1")).toHaveLength(2);
    });

    test("avec categorie ciblee : seulement celle affichee", () => {
        const cm = makeConfigManager(
            { kind: CST.SOURCE_KIND_GAME, games: [{ id: "509658" }, { id: "32982" }] },
            [liveChannel(), liveChannel({ channel_id: 2, game_id: "32982" })]
        );
        const matched = getSmartMatchedChannels(cm, "list1", "32982");
        expect(matched).toHaveLength(1);
        expect(matched[0].channel_id).toBe(2);
    });
});
