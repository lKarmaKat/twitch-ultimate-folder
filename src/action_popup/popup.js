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

chrome.runtime.sendMessage({type: CST.IS_USER_LOGGED_IN}, async (response) => {
    if (response.user_code) {
        console.log("Action popup IS_USER_LOGGED_IN")
        let authContainer = document.querySelector('.auth-container')
        let authInfo = authContainer.querySelector('.auth-code')
        authInfo.textContent = response.user_code
        authInfo.href = response.verification_uri
        
        let loader = document.querySelector('.loader')
        loader.hidden = true;
        authContainer.hidden = false;
    } else {
        let configContainer = document.querySelector('.config-container')
        let loader = document.querySelector('.loader')
        loader.hidden = true;
        configContainer.hidden = false;
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
