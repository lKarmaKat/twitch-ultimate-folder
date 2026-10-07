import * as CST from "@src/constantes.ts";
import { describe, test, expect } from "@jest/globals";
import { buildSnapshot } from "@src/service_worker/telemetrySnapshot.ts";
import type { I_CONFIG, I_NEW_LIST, UserConfigs } from "@src/service_worker/models/userStructure.ts";

const subList = (id: string) => ({ id, type: CST.TYPE_LIST });
const channel = (channelId: string | number) => ({ id: `item-${channelId}`, channel_id: channelId });
const allOthers = () => ({ id: CST.ALL_OTHER_CHANNELS, channel_id: CST.ALL_OTHER_CHANNELS });

function list(id: string, items: any[], overrides: Partial<I_NEW_LIST> = {}): I_NEW_LIST {
    return { ...CST.createNewList(), id, name: `secret-name-${id}`, items, ...overrides };
}

function account(configsList: I_CONFIG[], currentConfig = configsList[0].rootList.name): UserConfigs {
    return { userId: 123456789, currentConfig, configsList };
}

describe("buildSnapshot", () => {
    test("reports the install month, or legacy without an install date", () => {
        expect(buildSnapshot([], undefined, "1.1.0")).toEqual({
            v: 1, ext: "1.1.0", cohort: "legacy", configsPerAccount: [], lists: []
        });
        expect(buildSnapshot([], Date.UTC(2027, 1, 15), "1.1.0").cohort).toBe("2027-02");
    });

    test("walks the tree from the root and ignores unreachable lists", () => {
        const config: I_CONFIG = {
            rootList: list("node1", [subList("a")]),
            a: list("a", [subList("b")]),
            b: list("b", []),
            orphan: list("orphan", [])
        };

        const { lists } = buildSnapshot([account([config])], undefined, "1.1.0");

        expect(lists.map(l => l.depth)).toEqual([0, 1, 2]);
    });

    test("visits each list once when a sub-list points back at an ancestor", () => {
        const config: I_CONFIG = {
            rootList: list("node1", [subList("a")]),
            a: list("a", [subList("rootList")])
        };

        expect(buildSnapshot([account([config])], undefined, "1.1.0").lists).toHaveLength(2);
    });

    test("counts channels, sub-lists and the all-other-channels item", () => {
        const config: I_CONFIG = {
            rootList: list("node1", [channel("41245072"), channel(5678), allOthers(), subList("a")]),
            a: list("a", [])
        };

        const [root] = buildSnapshot([account([config])], undefined, "1.1.0").lists;

        expect(root).toMatchObject({ channels: 2, subLists: 1, allOthers: true });
    });

    test("names layout, sort and source, with defaults for configs saved by older versions", () => {
        const legacyList = list("node1", [subList("a"), subList("b")], { type: {}, sort: CST.ALPHA_SORT });
        delete (legacyList as any).source;
        const config: I_CONFIG = {
            rootList: legacyList,
            a: list("a", [], { type: { layout: CST.LIST_LAYOUT_GRID }, sort: CST.VIEWER_SORT, source: { ...CST.createNewList().source, kind: CST.SOURCE_KIND_GAME } }),
            b: list("b", [], { type: { layout: 99 } })
        };

        const lists = buildSnapshot([account([config])], undefined, "1.1.0").lists;

        expect(lists.map(({ layout, sort, source }) => ({ layout, sort, source }))).toEqual([
            { layout: "stack", sort: "alpha", source: "manual" },
            { layout: "grid", sort: "viewers", source: "game" },
            { layout: "unknown", sort: "custom", source: "manual" }
        ]);
    });

    test("summarises the current config of every account", () => {
        const first: I_CONFIG = { rootList: list("node1", []) };
        const current: I_CONFIG = {
            rootList: list("node1", [subList("a")], { name: "evening" }),
            a: list("a", [])
        };
        const other: I_CONFIG = { rootList: list("node1", []) };

        const snapshot = buildSnapshot([account([first, current], "evening"), account([other])], undefined, "1.1.0");

        expect(snapshot.configsPerAccount).toEqual([2, 1]);
        expect(snapshot.lists.map(l => [l.account, l.depth])).toEqual([[0, 0], [0, 1], [1, 0]]);
    });

    test("never carries list names, channel ids or the Twitch user id", () => {
        const config: I_CONFIG = {
            rootList: list("node1", [channel("41245072"), subList("a")]),
            a: list("a", [channel("98765432")])
        };

        const sent = JSON.stringify(buildSnapshot([account([config])], undefined, "1.1.0"));

        expect(sent).not.toContain("secret-name");
        expect(sent).not.toContain("41245072");
        expect(sent).not.toContain("98765432");
        expect(sent).not.toContain("123456789");
    });
});
