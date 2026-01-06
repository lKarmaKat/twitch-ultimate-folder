const iframe1 = document.createElement('iframe');
iframe1.id = "iframe";
iframe1.src = chrome.runtime.getURL('src/iframe/config-popup.html');
iframe1.allowTransparency="true";
// document.body.appendChild(iframe1);

const maindiv = document.createElement('div')
maindiv.id = 'iframe-rem';
maindiv.classList.add('test-iframe');
let shadowParent = maindiv.attachShadow({mode:'closed'})

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = chrome.runtime.getURL('assets/iframe.css');

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "DISPLAY_POPUP") {
    if (!document.querySelector("#iframe-rem")) {
      shadowParent.appendChild(iframe1);
      shadowParent.appendChild(link);
      document.body.appendChild(maindiv);
    }
  } 
  else if (msg.type === "HIDE_POPUP") {
    console.log("hide index.js");
    document.querySelector("#iframe-rem")?.remove();
  } else if (msg.type === 'THEME') {
    addStyle(msg.data);
  } 
});

chrome.runtime.sendMessage({type: 'GET_THEME'}, (data) => {
  addStyle(data.data);
});

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


function injectScript(file) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(file);
  script.id = 'sidebar-inject';
  script.type = 'module';
  script.onload = () => script.remove(); // optionnel
  (document.head || document.documentElement).appendChild(script);
}


function addStyle(msg) {
  let existingTag = document.head.querySelector('.injected-sidebar-css');
  if (existingTag) {
    document.head.querySelector('.monCSS').remove()
  }
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.classList.add('injected-sidebar-css');
  if (msg === true)
    link.href = chrome.runtime.getURL('assets/dark_channel.css');
  else
    link.href = chrome.runtime.getURL('assets/light_channel.css');

  document.head.appendChild(link);

}

injectScript('sidebar_inject.js');
