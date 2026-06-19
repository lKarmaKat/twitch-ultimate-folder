import { mount } from 'svelte';
import ActionPopup from './ActionPopup.svelte';
import { setupI18n } from '../i18n/index.js';

setupI18n().then(() => {
  mount(ActionPopup, {
    target: document.body,
  });
});
