import DisplayWrapper from "../components/DisplayWrapper.svelte";
import TitlePopup from "../components/TitlePopup.svelte";
import FlyoutPopup from "../components/FlyoutPopup.svelte";
import ConfigManager from "../configManager.svelte";
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
let flyout = null;
/**
 * flyoutShadowRoot is optional so callers that don't need flyoutList support
 * (there are none today, but keeps this function usable standalone) aren't
 * forced to build one.
 */
export function mountSidebar(shadowRoot, flyoutShadowRoot) {
  // Une re-injection (Twitch detruit notre noeud en re-rendant son menu) doit
  // demonter l'instance precedente : chaque montage construit son propre
  // ConfigManager, donc son propre port vers le service worker. Le flyout
  // partage cette instance : deux ports pour la meme sidebar serait absurde.
  if (sidebar) unmount(sidebar);
  if (flyout) unmount(flyout);
  const configManager = new ConfigManager(true);
  sidebar = mount(DisplayWrapper, { target: shadowRoot, props: { configManager } });
  if (flyoutShadowRoot) {
    flyout = mount(FlyoutPopup, { target: flyoutShadowRoot, props: { configManager } });
  }
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
