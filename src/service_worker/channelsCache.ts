import { api } from '../browserApi';
import * as CST from '../constantes';

export interface CachedChannel {
    channel_name: string;
    login: string;
    profile_image_url: string;
}

type CacheShape = { [id: string]: CachedChannel };

/**
 * Nom et avatar des chaines deja vues, conserves dans storage.local.
 *
 * Une config ne contient que des ids : des qu'une chaine est unfollow, plus
 * aucune reponse Twitch ne porte son nom. Ce cache evite d'interroger /users a
 * chaque reveil du service worker (MV3 s'endort apres ~30 s d'inactivite).
 *
 * Il est alimente par les appels /users deja faits pour les avatars, donc sans
 * requete supplementaire en regime normal.
 */
export class ChannelsCache {
    private cache: CacheShape | null = null;
    private loading: Promise<CacheShape> | null = null;

    private load(): Promise<CacheShape> {
        if (this.cache) return Promise.resolve(this.cache);
        if (this.loading) return this.loading;

        this.loading = api.storage.local.get(CST.CHANNELS_CACHE_KEY)
            .then((data: { [key: string]: any }) => {
                this.cache = (data?.[CST.CHANNELS_CACHE_KEY] as CacheShape) ?? {};
                return this.cache;
            })
            .catch(() => {
                // Un cache illisible n'est pas une erreur fatale : on repart de zero.
                this.cache = {};
                return this.cache;
            })
            .finally(() => {
                this.loading = null;
            });

        return this.loading;
    }

    async get(ids: number[]): Promise<Map<number, CachedChannel>> {
        const cache = await this.load();
        const found = new Map<number, CachedChannel>();
        for (const id of ids) {
            const entry = cache[String(id)];
            if (entry) found.set(id, entry);
        }
        return found;
    }

    /**
     * Ecrit les entrees nouvelles ou modifiees. Sans ce diff, le poller
     * declencherait un storage.set toutes les 6 s pour rien.
     */
    async put(entries: Map<number, CachedChannel>): Promise<void> {
        if (entries.size === 0) return;
        const cache = await this.load();

        let dirty = false;
        for (const [id, entry] of entries) {
            if (!entry?.channel_name) continue;
            const key = String(id);
            const prev = cache[key];
            if (prev
                && prev.channel_name === entry.channel_name
                && prev.login === entry.login
                && prev.profile_image_url === entry.profile_image_url) continue;
            // La reecriture repositionne la cle en fin d'objet : l'eviction
            // ci-dessous retire donc bien les entrees les plus anciennes.
            delete cache[key];
            cache[key] = entry;
            dirty = true;
        }
        if (!dirty) return;

        const keys = Object.keys(cache);
        if (keys.length > CST.CHANNELS_CACHE_MAX) {
            for (const key of keys.slice(0, keys.length - CST.CHANNELS_CACHE_MAX)) {
                delete cache[key];
            }
        }

        await api.storage.local.set({ [CST.CHANNELS_CACHE_KEY]: cache });
    }
}

export const channelsCache = new ChannelsCache();
