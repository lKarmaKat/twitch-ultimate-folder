import { addMessages, init, getLocaleFromNavigator, locale } from 'svelte-i18n';
import { api } from '../browserApi';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt_BR from './locales/pt_BR.json';
import pt_PT from './locales/pt_PT.json';
import hr from './locales/hr.json';
import ru from './locales/ru.json';
import pl from './locales/pl.json';
import sv from './locales/sv.json';
import fi from './locales/fi.json';
import no from './locales/no.json';
import el from './locales/el.json';
import bg from './locales/bg.json';

export const SUPPORTED_LOCALES = [
  'en', 'fr', 'es', 'de', 'it', 'pt_BR', 'pt_PT', 'hr', 'ru', 'pl', 'sv', 'fi', 'no', 'el', 'bg'
] as const;
export const DEFAULT_LOCALE = 'en';
export const LOCALE_STORAGE_KEY = 'local';

// Static dictionary loading: available synchronously, which avoids any loading
// flash ($isLoading) and works reliably inside the shadow DOM.
addMessages('en', en);
addMessages('fr', fr);
addMessages('es', es);
addMessages('de', de);
addMessages('it', it);
addMessages('pt_BR', pt_BR);
addMessages('pt_PT', pt_PT);
addMessages('hr', hr);
addMessages('ru', ru);
addMessages('pl', pl);
addMessages('sv', sv);
addMessages('fi', fi);
addMessages('no', no);
addMessages('el', el);
addMessages('bg', bg);

const KNOWN_LOCALES = new Set<string>(SUPPORTED_LOCALES);

function normalize(lang?: string | null): string {
  const l = (lang || '').toLowerCase().replace('_', '-');
  if (l.startsWith('pt-br')) return 'pt_BR';
  if (l.startsWith('pt')) return 'pt_PT';
  if (l.startsWith('nb') || l.startsWith('nn') || l.startsWith('no')) return 'no';
  const primary = l.split('-')[0];
  return KNOWN_LOCALES.has(primary) ? primary : DEFAULT_LOCALE;
}

/**
 * Initialises svelte-i18n. The locale comes from api.storage.local (`local`);
 * when missing it is detected from the browser, then persisted.
 */
export async function setupI18n(): Promise<void> {
  init({ fallbackLocale: DEFAULT_LOCALE, initialLocale: DEFAULT_LOCALE });

  let lang: string;
  try {
    const stored = await api.storage.local.get(LOCALE_STORAGE_KEY);
    lang = stored?.[LOCALE_STORAGE_KEY] as string;
    if (!lang) {
      lang = normalize(getLocaleFromNavigator());
      await api.storage.local.set({ [LOCALE_STORAGE_KEY]: lang });
    }
  } catch {
    lang = DEFAULT_LOCALE;
  }

  locale.set(lang);
}

/** Applies an already known locale (hot change over the `locale` port). */
export function applyLocale(lang?: string | null): void {
  if (!lang) return;
  locale.set(normalize(lang));
}
