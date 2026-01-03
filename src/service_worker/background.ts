import { DataFormatter } from './dataFormatter'

let dataFormatter = new DataFormatter();

console.log("####################");
console.log("Background.js");
console.log("####################");


setInterval(() => {
  dataFormatter.updateAll().then((info) => {
    console.log("updating bg", info);
    // portManager.sendMessageToAllTabs(CST.UPDATE_STREAM_INFO, info);
  })
}, 6000);