console.log("################")
console.log("################")
console.log("CONTENT SCRIPT")
console.log("################")
console.log("################")

function createDivWithIframeInShwadowDom(mainDivId, iframeSrcUrl, cssUrl = '', allowTransparency = false) {
  const iframe = document.createElement('iframe');
  iframe.src = iframeSrcUrl;
  iframe.id = "inner-iframe";
  iframe.allowTransparency = allowTransparency ? "true" : "false";

  const maindiv = document.createElement('div')
  maindiv.id = mainDivId;
  let shadowParent = maindiv.attachShadow({mode:'open'});

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;

  shadowParent.appendChild(link);
  shadowParent.appendChild(iframe)

  return maindiv;
}

const maindiv = createDivWithIframeInShwadowDom('iframe-rem', chrome.runtime.getURL('src/iframe/config-popup.html'),  chrome.runtime.getURL('assets/iframe.css'), true)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "DISPLAY_POPUP") {
    if (!document.querySelector("#iframe-rem")) {
      document.body.appendChild(maindiv);
    }
  } 
  else if (msg.type === "HIDE_POPUP") {
    document.querySelector("#iframe-rem")?.remove();
  } 

});



window.addEventListener("message", (event) => {
  if (event.data.type === 'navigate') {

    window.history.pushState({}, '', event.data.channel);

    window.dispatchEvent(new PopStateEvent('popstate'));
  }
});


function injectScript() {
  let t = document.querySelector("#side-nav .side-nav-section")
  const maindiv = document.createElement('div')
  maindiv.id = "sidebar_shadow";
  t.parentElement.insertBefore(maindiv, t);
  // t.parentElement.insertBefore(maindiv, t.parentElement.lastElementChild)
  // t.insertBefore(maindiv, t.firstElementChild);

  let shadowParent = maindiv.attachShadow({mode:'open'})
  const script2 = document.createElement('script');
  script2.src = chrome.runtime.getURL("sidebar_inject.js");
  script2.id = 'sidebar_inject';
  script2.type = 'module';
  shadowParent.appendChild(script2);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('assets/sidebar.css');
  shadowParent.appendChild(link);
  const link2 = document.createElement('link');
  link2.rel = 'stylesheet';
  link2.classList.add('injected-sidebar-css')
  link2.href = chrome.runtime.getURL('assets/dark_channel.css');
  shadowParent.appendChild(link2);


  const sideNav = document.querySelector('#side-nav');
  // sideNav.style.setProperty('width', '34rem', 'important');

  const sections = () => document.querySelectorAll('#side-nav .side-nav-section');

  let c = () => {
    const collapsed = document.querySelector('.side-nav--collapsed');
    if (collapsed) {
      maindiv.setAttribute('collapsed', "true");
      sections().forEach(el => el.style.removeProperty('display'));
    } else {
      maindiv.removeAttribute('collapsed');
      sections().forEach(el => el.style.setProperty('display', 'none', 'important'));
    }
  }
  const obs = new MutationObserver(c);
  c();
  obs.observe(document.querySelector('.side-nav--collapsed, .side-nav--expanded'), {attributeFilter: ['class'], attributes: true})

}

const injectObs = (obs, m) => {
  let t = document.querySelector("#side-nav .side-nav-section")
  let side = document.querySelector('.injected-sidebar-css');
  // console.log("observed changes")
  if (t && !side) {
    injectScript();
    if (m) { // always true ?
      console.log("Injected by mutation observer")
    }
    obs.disconnect();
  }
}
const observer = new MutationObserver((mut, obs) => {
  // let t = document.body
  injectObs(obs, true)
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

const sideNavObserver = new MutationObserver((mut, obs) => {
  let t = document.querySelector("#side-nav .side-nav-section")
  // console.log("########")
  // console.log("body observer")
  // console.log("########")
  if (t) {
    observer.observe(t, {
      childList: true,
      subtree: true
    });
    obs.disconnect()
  }
}).observe(document.body, { childList: true, subtree: true })

injectObs(observer);

