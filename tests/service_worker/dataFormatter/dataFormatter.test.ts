import { DataFormatter } from "@src/service_worker/dataFormatter.ts";
import { describe, test, expect } from "@jest/globals";

/**
 * smartList's "by game" and "started less than X minutes ago" rules need
 * game_id and started_at, which mixAllInfos used to drop on the floor (only
 * game_name survived). This locks in that both now reach the pushed output.
 */

function makeFormatter(overrides: Partial<{
    followed: any[];
    live: any[];
}> = {}) {
    const followed = overrides.followed ?? [
        { broadcaster_id: "1", broadcaster_login: "a", broadcaster_name: "A" }
    ];
    const live = overrides.live ?? [
        {
            user_id: "1",
            viewer_count: 42,
            language: "fr",
            game_id: "509658",
            game_name: "Just Chatting",
            started_at: "2026-08-01T10:00:00Z",
            title: "hello"
        }
    ];
    const twitchApi = {
        getuserAllFollowedStream: () => Promise.resolve(followed),
        getUserFollowedLiveStream: () => Promise.resolve(live),
        getUsersProfilPic: () => Promise.resolve([])
    };
    return new DataFormatter(twitchApi as any);
}

describe("DataFormatter", () => {
    test("propage game_id et started_at pour une chaine en direct", async () => {
        const formatter = makeFormatter();

        await formatter.updateAll();
        const entry = formatter.getInfotoSend().find(([id]) => id === 1);

        expect(entry).toBeDefined();
        const [, infos] = entry!;
        expect(infos.game_id).toBe("509658");
        expect(infos.started_at).toBe("2026-08-01T10:00:00Z");
        expect(infos.game_name).toBe("Just Chatting");
    });

    test("une chaine hors ligne n'a ni game_id ni started_at", async () => {
        const formatter = makeFormatter({ live: [] });

        await formatter.updateAll();
        const entry = formatter.getInfotoSend().find(([id]) => id === 1);

        expect(entry).toBeDefined();
        const [, infos] = entry!;
        expect(infos.isLive).toBeFalsy();
        expect(infos.game_id).toBeUndefined();
        expect(infos.started_at).toBeUndefined();
    });
});
