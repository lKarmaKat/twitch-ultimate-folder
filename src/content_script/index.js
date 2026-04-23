// const iframe1 = document.createElement('iframe');
// iframe1.id = "iframe";
// iframe1.src = chrome.runtime.getURL('src/iframe/config-popup.html');
// iframe1.allowTransparency="true";
// // document.body.appendChild(iframe1);

// const maindiv = document.createElement('div')
// maindiv.id = 'iframe-rem';
// maindiv.classList.add('test-iframe');
// let shadowParent = maindiv.attachShadow({mode:'closed'})

// const link = document.createElement('link');
// link.rel = 'stylesheet';
// link.href = chrome.runtime.getURL('assets/iframe.css');

function createDivWithIframeInShwadowDom(mainDivId, iframeSrcUrl, cssUrl = '', allowTransparency = false) {
  const iframe = document.createElement('iframe');
  iframe.src = iframeSrcUrl;
  iframe.id = "iframe";
  iframe.allowTransparency = allowTransparency ? "true" : "false";

  const maindiv = document.createElement('div')
  maindiv.id = mainDivId;
  let shadowParent = maindiv.attachShadow({mode:'open'})

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;

  shadowParent.appendChild(iframe);
  shadowParent.appendChild(link);

  return maindiv;
}

const maindiv = createDivWithIframeInShwadowDom('iframe-rem', chrome.runtime.getURL('src/iframe/config-popup.html'),  chrome.runtime.getURL('assets/iframe.css'), true)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "DISPLAY_POPUP") {
    if (!document.querySelector("#iframe-rem")) {
      // shadowParent.appendChild(iframe1);
      // shadowParent.appendChild(link);
      document.body.appendChild(maindiv);
    }
  } 
  else if (msg.type === "HIDE_POPUP") {
    document.querySelector("#iframe-rem")?.remove();
  } 
  else if (msg.type === 'THEME') {
    addStyle(msg.data);
  } 
});




// chrome.runtime.sendMessage({type: 'GET_THEME'}, (data) => {
//   addStyle(data.data);
// });

// setTimeout(() => {
//   window.history.pushState({}, '', '/akytio');

// // Déclencher l'événement que React Router écoute
// window.dispatchEvent(new PopStateEvent('popstate'));
// }, 5000);

window.addEventListener("message", (event) => {
  // console.log("message", event);
  if (event.data.type === 'navigate') {

    window.history.pushState({}, '', event.data.channel);

    // // Déclencher l'événement que React Router écoute
    window.dispatchEvent(new PopStateEvent('popstate'));
  } else {
    // console.log("unexpected message", event);
  }
});


function injectScript() {
  // let bt = document.querySelector("div[aria-label='Followed Channels']")
  // let before = document.createElement('div');
  // before.id = 'before-inject-sidebar';
  // bt.insertBefore(before, bt.firstElementChild);
  
  
  let t = document.querySelector("#side-nav .side-nav-section")
  // let t = document.querySelector("div.scrollable-area")
  // let t = document.querySelector("div.side-bar-contents")
  // t.style.position = "relative";
  // let newDiv = createDivWithIframeInShwadowDom('sidebar-inject', chrome.runtime.getURL('src/iframe/sidebar.html'), chrome.runtime.getURL('assets/sidebar.css'))

  const maindiv = document.createElement('div')
  maindiv.id = "sidebar_shadow";
  let shadowParent = maindiv.attachShadow({mode:'open'})
  let c = () => {
    const collapsed = document.querySelector('.side-nav--collapsed');

    if (collapsed) {
      maindiv.setAttribute('collapsed', collapsed);
    } else {
      maindiv.removeAttribute('collapsed')
    }
  }
  const obs = new MutationObserver(c);
  c();
  obs.observe(document.querySelector('.side-nav--collapsed, .side-nav--expanded'), {attributeFilter: ['class'], attributes: true})
  const script2 = document.createElement('script');
  script2.src = chrome.runtime.getURL("sidebar_inject.js");
  script2.id = 'sidebar_inject';
  script2.type = 'module';
  shadowParent.appendChild(script2);


  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('assets/sidebar.css');

  shadowParent.appendChild(link);

  // newDiv.style.height = '100vh';
  t.insertBefore(maindiv, t.firstElementChild);

  // const script1 = document.createElement('script');
  // script1.src = chrome.runtime.getURL("sidebar_inject.js");
  // script1.id = 'sidebar_inject';
  // script1.type = 'module';
  // script1.onload = () => script1.remove();
  // (document.head || document.documentElement).appendChild(script1);

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL("title_inject.js");
  script.id = 'title_inject';
  script.type = 'module';
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);


  const link2 = document.createElement('link');
  link2.rel = 'stylesheet';
  link2.classList.add('injected-sidebar-css')
  link2.href = chrome.runtime.getURL('assets/dark_channel.css');
  shadowParent.appendChild(link2);
}


function addStyle(msg) {
  console.log("UPDATING THEME " + msg)
  let shadow = document.querySelector('#sidebar_shadow').shadowRoot;
  let existingTag = shadow.querySelector('.injected-sidebar-css');
  if (existingTag) {
    existingTag.remove()
  }
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.classList.add('injected-sidebar-css');
  if (msg === true)
    link.href = chrome.runtime.getURL('assets/dark_channel.css');
  else
    link.href = chrome.runtime.getURL('assets/light_channel.css');

  shadow.appendChild(link);

}
const observer = new MutationObserver((mut, obs) => {
  // let t = document.body
  let t = document.querySelector("#side-nav .side-nav-section")
  if (t) {
    injectScript();
    obs.disconnect();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

