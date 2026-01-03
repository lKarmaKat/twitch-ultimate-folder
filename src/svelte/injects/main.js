import ConfigPopup from './ConfigPopup.svelte';
import TitlePopup from "./TitlePopup.svelte";



function mountConfigPopup() {
  let t = document.body

  if (!t) return;

  new ConfigPopup({
    target: t

  });
  
    new TitlePopup({
      target: document.body
    })
}

mountConfigPopup();
