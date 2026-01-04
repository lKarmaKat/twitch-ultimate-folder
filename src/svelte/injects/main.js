import ConfigPopup from '../ConfigPopup.svelte';
import TitlePopup from "../TitlePopup.svelte";
// import DisplayWrapper from "../DisplayWrapper.svelte";
import { mount } from 'svelte'





  const app = mount(ConfigPopup, {
    target: document.body,
  })
  
  mount(TitlePopup, {
    target: document.body,
  })
  
export default app
  // new ConfigPopup({
  //   target: document.body

  // });
  
    // new TitlePopup({
    //   target: document.body
    // })
// }

