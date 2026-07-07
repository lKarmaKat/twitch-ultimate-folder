import { FrameLocator, Locator, Page } from '@playwright/test'
import { PopupHelper } from '../helpers/popup.helper'
import * as CST from '../../src/constantes'

export class PopupPage {
    private popupHelper: PopupHelper
    private page: Page
    private popupFrame: FrameLocator;  // Frame de l'iframe

    constructor(page: Page) {
        this.popupHelper = new PopupHelper(page);
        this.page = page;
        this.popupFrame = page.frameLocator('#iframe-rem iframe');  // Accès à l'iframe
    }
    

    async getLoaderInnerHTML() {
        return await this.popupFrame.locator('.loading-wrapper').first().innerHTML();
    }

    async getMainChannelListElementCount() {
        return await (await this.getMainChannelListElement()).count();
    }
    
    async getMainChannelListElement() {
        return  this.popupFrame.locator('#main-channels-list a');
    }

    async getConfigChannelListElementCount() {
        return await this.popupFrame.locator('#config-list a').count();
    }

    async getConfigChannelList() {
        return  this.popupFrame.locator('#config-list');
    }

    async getNeedToConnect() {
        return await this.popupFrame.locator('#need-connect').waitFor({ timeout: 500 });
    }

    async getListInConfigChannelList(listId: string) {
        let configList = await this.getConfigChannelList();
        return  configList.locator(`#${listId}`);
    }

    async countNumberDirectSubLists(listId: string) {
        let list = await this.getListInConfigChannelList(listId)
        return await list.count();
    }

    async countNumberDirectElementInList(listId: string) {
        let list = await this.getListInConfigChannelList(listId)
        let c = await list.locator(':scope > .list-body > section > div.channel, :scope > .list-body > section > div.nested-list').count()
        return c;
    }

    async clickAddList(listId: string) {
        let list = await this.getListInConfigChannelList(listId)
        await list.getByRole('button').getByText('+').click();
    }

    async clickRemoveList(listId: string) {
        let listHeader = (await this.getListInConfigChannelList(listId)).locator('.list-header')
        await listHeader.getByRole('button').getByText('x').click();
    }

    async clickResetConfig() {
        await this.popupFrame.locator('#reset-btn').click();
    }

    async confirmReset() {
        await this.popupFrame.locator('#reset-confirm-yes').click();
    }

    async cancelReset() {
        await this.popupFrame.locator('#reset-confirm-no').click();
    }

    async clickAddRootList() {
        await this.popupFrame.locator('#add-root-list').click();
    }
    async clickRemoveChannel(channelId: string) {
        await this.popupFrame.locator(channelId).click();
    }

    async clickAddBtn(btnLoc: Locator) {
        let btn = await btnLoc.getByRole('button').filter({ hasText: '+'})
        btn.click();
    }

    async getDisplayConfigListElementCount() {
        return await (await this.getDisplayConfigListElements()).count();
    }

    async getDisplayConfigListElements() {
        return await this.popupFrame.locator('#display-container.display-wrapper a')
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
			v.y, { steps: 50 })
            
        await this.page.mouse.up();
        await dragEl.waitFor({ state: 'visible' })
        await this.page.waitForTimeout(500)
        // console.log(await dragEl.innerText())
    }

    async sendDefaultConf(conf: any, channelsRef: any) {
        let fr = this.page.frame({name: 'inner-iframe'})
        if (!fr) throw new Error('Frame not found')
        await fr.evaluate(({conf, channelsRef, GET_STREAMS_REF, GET_CURRENT_CONFIGURATION}) => {
            // const iframe = (document.querySelector('#iframe-rem') as any).shadowRoot.querySelector('#iframe') as any;
            const callback = (window as any).__portCallbackMap['eventbus'];
            if (!callback) throw new Error('Port callback not found in iframe');

            let deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

            callback({
                type: GET_CURRENT_CONFIGURATION,
                data: conf
            });
            callback({
                type: GET_STREAMS_REF,
                data: deepClone(channelsRef)
            });
        }, {conf, channelsRef, GET_STREAMS_REF: CST.GET_STREAMS_REF, GET_CURRENT_CONFIGURATION: CST.GET_CURRENT_CONFIGURATION})
    }

    async updateRef(channelsRef: any) {
        let fr = this.page.frame({name: 'inner-iframe'})
        if (!fr) throw new Error('Frame not found')
        await fr.evaluate(({channelsRef, GET_STREAMS_REF}) => {
            // const iframe = (document.querySelector('#iframe-rem') as any).shadowRoot.querySelector('#iframe') as any;
            const callback = (window as any).__portCallbackMap['eventbus'];
            if (!callback) throw new Error('Port callback not found in iframe');

            let deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));
            callback({
                type: GET_STREAMS_REF,
                data: deepClone(channelsRef)
            });
        }, {channelsRef, GET_STREAMS_REF: CST.GET_STREAMS_REF})
    }

    async sendAuth(isConnected: boolean) {
        let fr = this.page.frame({ name: 'inner-iframe' })
        if (!fr) throw new Error('Frame not found')
        await fr.evaluate((data) => {
            console.log("LOOKING FOR PORT IN", (window as any).__portCallbackMap)
            const callback =(window as any).__portCallbackMap?.['auth'];
            if (!callback) throw new Error('Auth port callback not found in iframe');
            callback({ data });
        }, isConnected)
    }
}