import ConfigPopup from '../components/ConfigPopup.svelte';
import TitlePopup from "../components/TitlePopup.svelte";
import { setupI18n } from "../../i18n/index.js";
import { mount } from 'svelte'
// popup_inject.js
import { LIGHT_CLASS } from '../twitchTheme.js'; // à exporter en plus de readTwitchDark/watchTwitchTheme

if (new URLSearchParams(location.search).get('dark') === '0') {
  document.documentElement.classList.add(LIGHT_CLASS);
}

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
