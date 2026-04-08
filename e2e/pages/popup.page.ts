import { Locator, Page } from '@playwright/test'
import { PopupHelper } from '../helpers/popup.helper'

export class PopupPage {
    private popupHelper: PopupHelper
    private page: Page
    constructor(page: Page) {
        this.popupHelper = new PopupHelper(page);
        this.page = page;
    }
    

    async getLoaderInnerHTML() {
        return await this.page.locator('.loading-wrapper').first().innerHTML();
    }

    async getMainChannelListElementCount() {
        return await (await this.getMainChannelListElement()).count();
    }
    
    async getMainChannelListElement() {
        return await this.page.locator('#main-channels-list a');
    }

    async getConfigChannelListElementCount() {
        return await this.page.locator('#config-list a').count();
    }

    async getConfigChannelList() {
        return await this.page.locator('#config-list');
    }

    async getListInConfigChannelList(listId: string) {
        let configList = await this.getConfigChannelList();
        return await configList.locator(`#${listId}`);
    }

    async countNumberDirectSubLists(listId: string) {
        let list = await this.getListInConfigChannelList(listId)
        return await list.count();
    }

    async clickAddList(listId: string) {
        let list = await this.getListInConfigChannelList(listId)
        await list.getByRole('button').getByText('+').click();
    }

    async clickRemoveList(listId: string) {
        let listHeader = (await this.getListInConfigChannelList(listId)).locator('.list-header')
        await listHeader.getByRole('button').getByText('x').click();
    }

    async clickRemoveChannel(channelId: string) {
        await this.page.locator(channelId).click();
    }

    async clickAddBtn(btnLoc: Locator) {
        let btn = await btnLoc.getByRole('button').filter({ hasText: '+'})
        btn.click();
    }

    async getDisplayConfigListElementCount() {
        return await (await this.getDisplayConfigListElements()).count();
    }

    async getDisplayConfigListElements() {
        return await this.page.locator('#display-container.display-wrapper a')
    }

    async getFirstCard(locator: Locator) {
        return locator.locator('.channel').first();
    }

    async moveTo(x: number, y: number) {
        await this.page.mouse.move(
        x,
        y, { steps: 20 })
    }

    async dragElementToList(channelName: string, destListId: string, pos: number) {
        let dragEl = (await this.getMainChannelListElement()).filter({ hasText: channelName })
        let { x, y } = await this.popupHelper.getElementMidCoord(dragEl);

        await dragEl.hover();
        await this.page.mouse.down();
        await this.moveTo(x, y)

        await this.moveTo(x+20, y+20)
        
        let c = await this.popupHelper.getListApproachCoord(destListId, pos);

        await this.moveTo(c.x, c.y)

        let v = await this.popupHelper.getListDropCoord(destListId, pos);
        await this.page.mouse.move(
			v.x,
			v.y, { steps: 20 })
            
        await this.page.mouse.up();
        await dragEl.waitFor({ state: 'visible' })
        // console.log(await dragEl.innerText())
    }

    async sendDefaultConf(conf: any, channelsRef: any) {
        await this.page.evaluate(({conf, channelsRef}) => {
            let deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));
    
            (window as any).__onMessageCallback({
                type: "GET_CURRENT_CONFIGURATION",
                data: conf
            });
            (window as any).__onMessageCallback({
                type: "GET_STREAM_INFO",
                data: deepClone(channelsRef)
            });
        }, {conf, channelsRef})
    }

    
}