const iframe1 = document.createElement('iframe');
iframe1.id = "iframe";
iframe1.src = chrome.runtime.getURL('content_script/config-popup/config-popup.html');
iframe1.allowTransparency="true";
// document.body.appendChild(iframe1);

const maindiv = document.createElement('div')
maindiv.id = 'iframe-rem';
maindiv.classList.add('test-iframe');
let shadowParent = maindiv.attachShadow({mode:'closed'})

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = chrome.runtime.getURL('content_script/config-popup/iframe.css');

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
  }
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
  // const iframe1 = document.createElement('iframe');
  // iframe1.id = "iframe";
  // iframe1.src = chrome.runtime.getURL('content_script/config-popup/sidebar.html');
  // iframe1.allowTransparency="true";
  // const link = document.createElement('link');
  // link.rel = 'stylesheet';
  // link.href = chrome.runtime.getURL('content_script/config-popup/sidebar.css');
  // const maindiv = document.createElement('div')
  // maindiv.classList.add('test-iframe');
  // let shadowParent = maindiv.attachShadow({mode:'closed'})
  // shadowParent.appendChild(iframe1);
  // shadowParent.appendChild(link);

    // function mountSidebar() {
    //   let t = document.querySelector("div[aria-label='Followed Channels']")
      
    //   if (!t) return;
    //   t.insertBefore(maindiv, t.firstElementChild);

    // }

    // const observer = new MutationObserver((mlist, obs) => {
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


  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(file);
  script.type = 'text/javascript';
  script.onload = () => script.remove(); // optionnel
  (document.head || document.documentElement).appendChild(script);
}

injectScript('sidebar.js');


/**
 * 
 * Le service_worker :
 *  met à disposition la configuration actuelle.
 *  récupère les listes des chaines en ligne, hors ligne ainsi que les infos (profil pic' url)
 *  s'abonne aux websocket stream.online et stream.offline approprié.
 *  il construit un référentiel de chaines qu'il met à disposition.
 *  attend l'ouverture de port pour diffuser les changements (changement de status, update titre/viewer count)
 *  
 * 
 * 
 * 
 * les contents_scripts injecte :
 *  l'iframe de configuration
 *  l'iframe d'affichage
 *  
 *  
 */