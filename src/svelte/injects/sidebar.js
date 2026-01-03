import DisplayWrapper from "./DisplayWrapper.svelte";
import TitlePopup from "./TitlePopup.svelte";


function mountSidebar() {
  // let t = document.body
  let t = document.querySelector("div[aria-label='Followed Channels']")

  if (!t) return;


  new DisplayWrapper({
    target: t
  })

  new TitlePopup({
    target: document.body
  })
}


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
