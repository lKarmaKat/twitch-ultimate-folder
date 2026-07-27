import HelpPage from '../components/HelpPage.svelte';
import { setupI18n } from "../../i18n/index.js";
import { mount } from 'svelte'

let app;

// Set up i18n before mounting: the help page runs in its own tab and shares no
// dictionary with the config iframe.
setupI18n().then(() => {
  app = mount(HelpPage, {
    target: document.body,
  })
})

export default app
