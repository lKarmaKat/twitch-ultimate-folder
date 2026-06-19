import ConfigPopup from '../components/ConfigPopup.svelte';
import TitlePopup from "../components/TitlePopup.svelte";
import { setupI18n } from "../../i18n/index.js";
import { mount } from 'svelte'

let app;

// Initialise l'i18n avant de monter les composants.
setupI18n().then(() => {
  app = mount(ConfigPopup, {
    target: document.body,
  })

  mount(TitlePopup, {
    target: document.body,
  })
})

export default app
