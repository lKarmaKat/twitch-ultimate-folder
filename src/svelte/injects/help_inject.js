import HelpPage from '../components/HelpPage.svelte';
import { setupI18n } from "../../i18n/index.js";
import { mount } from 'svelte'

let app;

// Initialise l'i18n avant de monter le composant : la page d'aide est un
// contexte isole (onglet dedie), les dictionnaires ne sont pas partages avec
// l'iframe de configuration.
setupI18n().then(() => {
  app = mount(HelpPage, {
    target: document.body,
  })
})

export default app
