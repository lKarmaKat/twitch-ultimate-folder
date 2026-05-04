import * as CST from '../constantes.js'



let btn = document.querySelector("#btn");
btn.addEventListener('click', () => {
    chrome.runtime.sendMessage({type: CST.DISPLAY_POPUP});
})

let checkbox = document.querySelector("input");


checkbox.addEventListener("change", () => {
    (async () => {
        let o;
        if (checkbox.checked) {
            o = {type: CST.CHANGE_THEME, value: true}
        } else {
            o = {type: CST.CHANGE_THEME, value: false};
        }
        const response = await chrome.runtime.sendMessage(o);
        if (!response) {    
            checkbox.checked = false;
            document.body.classList.remove('dark');
        } else {
            document.body.classList.toggle('dark');
        }
    })();
});

chrome.runtime.sendMessage({type: CST.GET_THEME}, (response) => {
    console.log("received", response);
    if (response.type === CST.THEME) {
        checkbox.checked = response.data;
    }
});



    // (async () => {
    //     let o;
    //     if (checkbox.checked) {
    //         o = {type: 'THEME', value: 'SOMBRE'}
    //     } else {
    //         o = {type: 'THEME', value: 'CLAIR'};
    //     }
    //     const response = await chrome.runtime.sendMessage(o);
    //     if (!response)
    //         checkbox.checked = !checkbox.checked
    // })();
