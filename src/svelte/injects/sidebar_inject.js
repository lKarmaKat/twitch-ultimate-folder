import DisplayWrapper from "../components/DisplayWrapper.svelte";
import TitlePopup from "../components/TitlePopup.svelte";
import { setupI18n } from "../../i18n/index.js";
import { mount, unmount } from 'svelte'

/**
 * Montage de la sidebar dans le shadow root que le content script vient de
 * creer. Plus de MutationObserver ici : l'appelant sait deja que la cible
 * existe, puisqu'il l'a construite.
 *
 * Ce fichier n'est plus un point d'entree autonome. Il etait charge par une
 * balise <script type="module"> dans le monde principal de la page, ce qui
 * imposait externally_connectable pour joindre le service worker — non
 * supporte par Firefox. Il fait desormais partie du bundle du content script.
 */
let sidebar = null;
export function mountSidebar(shadowRoot) {
  // Une re-injection (Twitch detruit notre noeud en re-rendant son menu) doit
  // demonter l'instance precedente : chaque DisplayWrapper construit son propre
  // ConfigManager, donc son propre port vers le service worker.
  if (sidebar) unmount(sidebar);
  sidebar = mount(DisplayWrapper, { target: shadowRoot });
  return sidebar;
}

/** Popup de titre de chaine, montee une fois pour l'onglet. */
export function mountTitlePopup() {
  return mount(TitlePopup, { target: document.body });
}

/**
 * Charge les dictionnaires avant tout montage. Idempotent : le content script
 * l'appelle une fois et reutilise la promesse pour chaque montage ulterieur.
 */
let i18nReady = null;
export function whenI18nReady() {
  if (!i18nReady) i18nReady = setupI18n();
  return i18nReady;
}
