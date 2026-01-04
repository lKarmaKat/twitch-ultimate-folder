import DisplayWrapper from "../DisplayWrapper.svelte";
import TitlePopup from "../TitlePopup.svelte";
import { mount } from 'svelte'


function mountSidebar() {
  // let t = document.body
  let t = document.querySelector("div[aria-label='Followed Channels']")

  if (!t) return;
  mount(DisplayWrapper, {
    target: t,
  })

  mount(TitlePopup, {
     target: document.body,
   })

  // new DisplayWrapper({
  //   target: t
  // })

  // new TitlePopup({
  //   target: document.body
  // })
}
// export default app

const observer = new MutationObserver((mut, obs) => {
  // let t = document.body
  let t = document.querySelector("div[aria-label='Followed Channels']")
  if (t) {
    mountSidebar();
    obs.disconnect();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
