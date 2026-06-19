import { addMessages, init, getLocaleFromNavigator, locale } from 'svelte-i18n';
import en from './locales/en.json';
import fr from './locales/fr.json';

export const SUPPORTED_LOCALES = ['en', 'fr'] as const;
export const DEFAULT_LOCALE = 'en';
export const LOCALE_STORAGE_KEY = 'local';

// Chargement statique des dictionnaires : ils sont disponibles de façon
// synchrone, ce qui évite tout flash de chargement ($isLoading) et fonctionne
// de manière fiable dans le shadow DOM.
addMessages('en', en);
addMessages('fr', fr);

function normalize(lang?: string | null): string {
  const l = (lang || '').toLowerCase();
  return l.startsWith('fr') ? 'fr' : 'en';
}

/**
 * Initialise svelte-i18n. La locale provient de chrome.storage.local (clé
 * `local`). Si elle n'existe pas, on la détecte automatiquement depuis le
 * navigateur puis on la persiste. Sinon, on suit systématiquement le storage.
 */
export async function setupI18n(): Promise<void> {
  init({ fallbackLocale: DEFAULT_LOCALE, initialLocale: DEFAULT_LOCALE });

  let lang: string;
  try {
    const stored = await chrome.storage.local.get(LOCALE_STORAGE_KEY);
    lang = stored?.[LOCALE_STORAGE_KEY] as string;
    if (!lang) {
      lang = normalize(getLocaleFromNavigator());
      await chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: lang });
    }
  } catch {
    lang = DEFAULT_LOCALE;
  }

  locale.set(lang);
}

/** Applique une locale déjà connue (changement à chaud via le port `locale`). */
export function applyLocale(lang?: string | null): void {
  if (!lang) return;
  locale.set(normalize(lang));
}
