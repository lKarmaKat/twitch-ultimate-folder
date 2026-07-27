import DisplayWrapper from "../components/DisplayWrapper.svelte";
import TitlePopup from "../components/TitlePopup.svelte";
import { setupI18n } from "../../i18n/index.js";
import { mount } from 'svelte'

function mountSidebar() {
    mount(DisplayWrapper, {
     target: document.querySelector('#sidebar_shadow').shadowRoot,
   })
  // let t = document.body

  // let bt = document.querySelector("div[aria-label='Followed Channels']")
  // let before = document.createElement('div');
  // before.id = 'before-inject-sidebar';
  // bt.insertBefore(before, bt.firstElementChild);
  
  
  // let t = document.querySelector("div.scrollable-area")
  // // let t = document.querySelector("div.side-bar-contents")
  // // t.style.position = "relative";
  // let side = document.createElement('div');
  // t.insertBefore(side, t.firstElementChild);
  // if (!t) return;

  // mount(WaitingConfig, {
  //   target: side,
  // })

  // mount(DisplayWrapper, {
  //    target: side,
  //  })

  // mount(DisplayWrapper, {
  //    target: document.body,
  //  })

  // mount(TitlePopup, {
  //    target: document.body,
  //  })

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
  let sideBarShadowDiv = document.querySelector("#sidebar_shadow")

  console.log("mutation found ", sideBarShadowDiv)
  if (sideBarShadowDiv) {
    mountSidebar();
    obs.disconnect();
  }
});

// Set up i18n before any mount, then start the components.
setupI18n().then(() => {
  mount(TitlePopup, {
    target: document.body,
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
