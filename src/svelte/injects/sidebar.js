import DisplayWrapper from "../DisplayWrapper.svelte";
import TitlePopup from "../TitlePopup.svelte";
import { mount } from 'svelte'

  mount(DisplayWrapper, {
     target: document.querySelector('#sidebar_shadow').shadowRoot,
   })

  // mount(TitlePopup, {
  //    target: document.body,
  //  })

function mountSidebar() {
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

// const observer = new MutationObserver((mut, obs) => {
//   // let t = document.body
//   let t = document.querySelector("div[aria-label='Followed Channels']")
//   if (t) {
//     mountSidebar();
//     obs.disconnect();
//   }
// });

// observer.observe(document.body, {
//   childList: true,
//   subtree: true
// });
