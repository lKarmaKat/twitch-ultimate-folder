import { describe, test, expect } from "@jest/globals";
import {
    encodeConfig,
    decodeConfig,
    pickActiveConfig,
    ConfigTransferError
} from "@src/svelte/configTransfer.ts";
import type { UserConfigs } from "@src/service_worker/models/userStructure.ts";

const mkList = (id: string, name: string, items: any[]) =>
    ({ id, name, items, sort: 2, behavior: {}, style: {}, type: {} }) as any;

function makeConfig(currentConfig = "default"): UserConfigs {
    return {
        userId: 41245678,
        currentConfig,
        configsList: [{
            rootList: mkList("rootList", "default", [
                { id: "list_fps", type: "list" },
                { channel_id: "71092938", id: "chan_1" }
            ]),
            list_fps: mkList("list_fps", "FPS", [{ channel_id: "207813352", id: "chan_2" }])
        }]
    } as UserConfigs;
}

/**
 * Two invariants: the string survives any text channel unaltered, and a damaged
 * paste is rejected instead of overwriting the user's config with garbage.
 */
describe("transfert de configuration", () => {
    test("un aller-retour restitue la configuration à l'identique", async () => {
        const config = makeConfig();

        const encoded = await encodeConfig(config);
        const decoded = await decodeConfig(encoded);

        expect(decoded).toEqual(config);
    });

    test("l'encodage produit du base64 gzip", async () => {
        const encoded = await encodeConfig(makeConfig());

        // gzip header (0x1f 0x8b) once the base64 is decoded
        expect(encoded).toMatch(/^H4sI/);
        expect(encoded).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    test("le gzip réduit nettement une configuration réaliste", async () => {
        const config = makeConfig();
        const root: any[] = [];
        for (let f = 0; f < 6; f++) {
            const listId = `list_${f}`;
            const items = Array.from({ length: 10 }, (_unused, i) => ({
                channel_id: `${100000000 + f * 100 + i}`,
                id: `chan_${f}_${i}`
            }));
            (config.configsList[0] as any)[listId] = mkList(listId, `Dossier ${f}`, items);
            root.push({ id: listId, type: "list" });
        }
        config.configsList[0].rootList = mkList("rootList", "default", root);

        const encoded = await encodeConfig(config);
        const plainBase64Length = Math.ceil(JSON.stringify(config).length / 3) * 4;

        expect(encoded.length).toBeLessThan(plainBase64Length / 2);
        expect(await decodeConfig(encoded)).toEqual(config);
    });

    // Mail clients and Discord readily wrap a long string.
    test("les retours à la ligne introduits par le transport sont tolérés", async () => {
        const config = makeConfig();
        const encoded = await encodeConfig(config);
        const wrapped = encoded.replace(/(.{40})/g, "$1\n");

        expect(await decodeConfig(`  ${wrapped}  `)).toEqual(config);
    });

    test.each([
        ["une chaîne vide", "", "EMPTY"],
        ["du texte qui n'est pas du base64", "!!! pas du base64 !!!", "BASE64"],
        ["du base64 qui n'est pas du gzip", btoa("hello world"), "GZIP"]
    ])("refuse %s", async (_label, payload, code) => {
        await expect(decodeConfig(payload)).rejects.toMatchObject({ code });
    });

    test("refuse une enveloppe de version inconnue", async () => {
        const encoded = await encodeConfig(makeConfig());
        // Same encoding, but with a forced future version.
        const future = await encodeFutureEnvelope();

        expect(encoded).not.toEqual(future);
        await expect(decodeConfig(future)).rejects.toMatchObject({ code: "VERSION" });
    });

    test("refuse un export sans configuration exploitable", async () => {
        const empty = await encodeConfig({
            userId: 1,
            currentConfig: "default",
            configsList: []
        } as unknown as UserConfigs);

        await expect(decodeConfig(empty)).rejects.toMatchObject({ code: "CONFIG" });
    });

    test("les rejets sont des ConfigTransferError", async () => {
        await expect(decodeConfig("")).rejects.toBeInstanceOf(ConfigTransferError);
    });

    describe("pickActiveConfig", () => {
        test("retient la configuration désignée par currentConfig", () => {
            const config = makeConfig("default");
            config.configsList.push({ rootList: mkList("rootList", "autre", []) } as any);

            expect(pickActiveConfig(config).rootList.name).toBe("default");
        });

        test("retombe sur la première quand currentConfig ne correspond à rien", () => {
            const config = makeConfig("nom-disparu");

            expect(pickActiveConfig(config)).toBe(config.configsList[0]);
        });
    });
});

/** Hand-built `v: 99` envelope, to exercise the version guard. */
async function encodeFutureEnvelope(): Promise<string> {
    const json = JSON.stringify({ v: 99, exportedAt: "", data: makeConfig() });
    const cs = new CompressionStream("gzip");
    const writer = cs.writable.getWriter();
    writer.write(new TextEncoder().encode(json));
    writer.close();

    const reader = cs.readable.getReader();
    const chunks: Uint8Array[] = [];
    for (; ;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    const merged = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let offset = 0;
    for (const c of chunks) { merged.set(c, offset); offset += c.length; }

    let binary = "";
    for (const byte of merged) binary += String.fromCharCode(byte);
    return btoa(binary);
}
