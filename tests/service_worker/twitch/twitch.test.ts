import { retryAfterMsFromHeaders } from "@src/service_worker/twitch.ts";
import { describe, test, expect } from "@jest/globals";

/**
 * Helix annonce son délai de reprise de deux façons : `Retry-After` en secondes
 * sur un 429, et `Ratelimit-Reset` en epoch unix. Les confondre ferait attendre
 * l'extension jusqu'en 2027.
 */

const NOW = 1_700_000_000_000;

function headers(entries: Record<string, string>): Headers {
    return { get: (name: string) => entries[name] ?? null } as Headers;
}

describe("retryAfterMsFromHeaders", () => {
    test("Retry-After est lu en secondes", () => {
        expect(retryAfterMsFromHeaders(headers({ "Retry-After": "30" }), NOW)).toBe(30000);
    });

    test("Retry-After prime sur Ratelimit-Reset", () => {
        const both = headers({ "Retry-After": "5", "Ratelimit-Reset": String(NOW / 1000 + 600) });

        expect(retryAfterMsFromHeaders(both, NOW)).toBe(5000);
    });

    test("Ratelimit-Reset est converti en délai relatif", () => {
        const reset = headers({ "Ratelimit-Reset": String(NOW / 1000 + 42) });

        expect(retryAfterMsFromHeaders(reset, NOW)).toBe(42000);
    });

    test("un Ratelimit-Reset déjà passé ne donne pas de délai négatif", () => {
        const reset = headers({ "Ratelimit-Reset": String(NOW / 1000 - 10) });

        expect(retryAfterMsFromHeaders(reset, NOW)).toBeNull();
    });

    test("sans en-tête exploitable, le backoff de l'appelant décide", () => {
        expect(retryAfterMsFromHeaders(headers({}), NOW)).toBeNull();
        expect(retryAfterMsFromHeaders(headers({ "Retry-After": "bientôt" }), NOW)).toBeNull();
    });
});
