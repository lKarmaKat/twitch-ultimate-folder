import * as CST from '../constantes.js'



let btn = document.querySelector("#btn");
btn.addEventListener('click', () => {
    chrome.runtime.sendMessage({type: CST.DISPLAY_POPUP});
})

let themeCheckbox = document.querySelector("#theme");
let alignmentCheckbox = document.querySelector("#alignment");


themeCheckbox.addEventListener("change", () => {
    (async () => {
        let o;
        if (themeCheckbox.checked) {
            o = {type: CST.CHANGE_THEME, value: true}
        } else {
            o = {type: CST.CHANGE_THEME, value: false};
        }
        const response = await chrome.runtime.sendMessage(o);
        if (!response) {    
            themeCheckbox.checked = false;
            document.body.classList.remove('dark');
        } else {
            themeCheckbox.checked = response.data;
            document.body.classList.toggle('dark');
        }
    })();
});

chrome.runtime.sendMessage({type: CST.GET_THEME}, (response) => {
    console.log("received", response);
    if (response.type === CST.THEME) {
        themeCheckbox.checked = response.data;
    }
});


chrome.runtime.sendMessage({type: CST.GET_ALIGNMENT}, (response) => {
    console.log("received", response);
    if (response.type === CST.ALIGNMENT) {
        alignmentCheckbox.checked = !response.data;
    }
});


alignmentCheckbox.addEventListener("change", () => {
    (async () => {
        let o;
        if (alignmentCheckbox.checked) {
            o = {type: CST.CHANGE_ALIGNMENT, value: false};
        } else {
            o = {type: CST.CHANGE_ALIGNMENT, value: true}
        }
        const response = await chrome.runtime.sendMessage(o);
        if (!response) {    
            alignmentCheckbox.checked = false;
        } else {
            alignmentCheckbox.checked = !response.data
        }
    })();
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
