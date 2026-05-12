import { Page, Locator } from "@playwright/test";


export class PopupHelper {
    private page: Page

    constructor(page: Page) {
        this.page = page;
    }

    async getElementMidCoord(el: Locator) {
        let elCoor = await el.boundingBox();
        // console.log(elCoor)
        return {
            x: elCoor!.x + elCoor!.width/2,
            y: elCoor!.y + elCoor!.height/2
        }
    }


    async getListDropCoord(list: string, pos: number) {
        let elements = this.page.frameLocator('#iframe').locator(`#${list} > div.list-body > section > div:is(.nested-list, .channel)`);
        // console.log(await list.innerHTML())
        let count = await elements.count();
        // const count = await list.evaluate(el => {
        //     return el.querySelectorAll(':scope > .list-body > section > div.channel, :scope > .list-body > section > div.nested-list').length;
        // });
        console.log(count)
        if (pos + 1 <= count) {
            let followingElement = await elements.nth(pos);
            // console.log(await followingElement.innerText());
            let coord = await followingElement.boundingBox();
            return {
                x: coord!.x + coord!.width/2,
                y: coord!.y + 10
            }
        } else {
            let coord = await this.page.frameLocator('#iframe').locator(`#${list}`).boundingBox();
            return {
                x: coord!.x + coord!.width/2,
                y: coord!.y + coord!.height - 5
            }
        }
    }

    async getListApproachCoord(list: string, pos: number) {
        let elements = this.page.frameLocator('#iframe').locator(`#${list} > div.list-body > section > div:is(.nested-list, .channel)`);

        let count = await elements.count();
        console.log(count)

        if (pos + 1 <= count) {
            let followingElement = await elements.nth(pos);
            // console.log(await followingElement.innerText());
            let coord = await followingElement.boundingBox();
            return {
                x: coord!.x - 10,
                y: coord!.y + 10
            }
        } else {
            let coord = await this.page.frameLocator('#iframe').locator(`#config-list > #${list}`).boundingBox();
            return {
                x: coord!.x + 10,
                y: coord!.y + coord!.height - 5
            }
        }
    }


}