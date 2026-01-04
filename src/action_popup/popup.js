


let btn = document.querySelector("#btn");
btn.addEventListener('click', () => {
    chrome.runtime.sendMessage({type: 'DISPLAY_POPUP'});
})

let checkbox = document.querySelector("input");


checkbox.addEventListener("change", () => {
    (async () => {
        let o;
        if (checkbox.checked) {
            o = {type: 'THEME', value: true}
        } else {
            o = {type: 'THEME', value: false};
        }
        const response = await chrome.runtime.sendMessage(o);
        if (!response)
            checkbox.checked = false;
    })();
});

chrome.runtime.sendMessage({type: "GET_THEME"}, (response) => {
    console.log("received", response);
    if (response.type === "THEME") {
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
