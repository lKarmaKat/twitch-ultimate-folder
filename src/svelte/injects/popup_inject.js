import ConfigPopup from '../components/ConfigPopup.svelte';
import TitlePopup from "../components/TitlePopup.svelte";
import { setupI18n } from "../../i18n/index.js";
import { mount } from 'svelte'

let app;

// Set up i18n before mounting the components.
setupI18n().then(() => {
  app = mount(ConfigPopup, {
    target: document.body,
  })

  mount(TitlePopup, {
    target: document.body,
  })
})

export default app
