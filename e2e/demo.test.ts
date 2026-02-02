import { expect, test } from '@playwright/test';
import { beforeAll, afterAll, vi, describe, beforeEach} from 'vitest'
import { mount } from 'svelte';
import * as sinon from 'sinon';
import { addListener } from 'process';
import {config, channelsRef, newChannels, newChannel} from '../svelte_tests/utils/const';

let deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

test.beforeEach(async ({ page }) => {

});

test('home page has expected h1', async ({ page }) => {

	// let c;
	// let ch = chrome.runtime.connect.returns({
	// 	name: 'test-port',
	// 	onMessage: {
	// 		addListener: chrome.stub((callback: () => void) => {
	// 			c = callback;
	// 		})
	// 	},
	// 	onDisconnect: {
	// 		addListener: chrome.stub()
	// 	}
	// })


	await page.addInitScript(() => {
		const port = {
			onMessage: {
				addListener: (callback: () => {}) => {
					if (!(window as any).__onMessageCallback)
							(window as any).__onMessageCallback = callback;
				}
			},
			onDisconnect: {
				addListener: () => {}
			}
		};

		window.chrome = {
			runtime: {
				id: 'fake-extension-id',
				getURL: (path: string) => `chrome-extension://fake-id/${path}`,
				onMessage: {
					addListener: () => {},
					removeListener: () => {},
					hasListener: () => false,
					hasListeners: () => false,
					addRules: () => Promise.resolve(),
					removeRules: () => Promise.resolve(),
					getRules: () => Promise.resolve([]),
				},
				sendMessage: () => Promise.resolve(),
				connect: () => { return port}
			},
		} as any;
	
	})
	await page.goto('src/iframe/config-popup.html');
	//   await page.screenshot({ path: 'screenshot.png' });


	const loadingLogo = await page.locator('.loading-wrapper').first().innerHTML();
	expect(loadingLogo).toContain('<div class="loading-overlay');

	let conf: any = {
		userId: 0,
		currentConfig: "liste principale",
		configsList: [
			deepClone(config)
		]
	}
	await page.waitForFunction(() => (window as any).__onMessageCallback && typeof (window as any).__onMessageCallback === 'function');

	await page.pause()
	await page.evaluate(({conf, channelsRef}) => {
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
	  
	await page.getByRole('listitem').filter({ hasText: 'x BobRoss Art' }).getByText('x').click();
	await page.locator('#list-rootList').getByText('+').first().click();
	// console.log(page.locator('.overlay-side').innerHTML());
	
	await page.locator('#main-channels-list').getByRole('listitem').filter({ hasText: 'BobRoss'}).hover();
	let chaineCoord = await page.locator('#main-channels-list').getByRole('listitem').filter({ hasText: 'BobRoss'}).boundingBox();
	await page.mouse.down();
	
	let cibleCoor = await page.locator('#list-rootList').getByRole('listitem').filter({hasText: 'list 11'}).locator('.list-body').boundingBox();
	if (cibleCoor) {
		await page.mouse.move(
			(chaineCoord!.x  + chaineCoord!.width/2),
			cibleCoor.y + cibleCoor.height / 2 + 20, { steps: 20 })
		await page.mouse.move(
			cibleCoor.x + cibleCoor.width / 2,
			cibleCoor.y + cibleCoor.height / 2 + 20, { steps: 20 })
	}
	await page.waitForTimeout(100);
	await page.mouse.up();


	await page.locator('#display-container').locator('.channel-overlay').first().hover();

	await page.waitForTimeout(100);

	const titlePopup = await page.locator('#tooltip').first();
	const title = await titlePopup.innerText();
	expect(title).toContain('TRAHISON, AMITIÉ, PVP')

	const list = await page.locator('#list-rootList').getByRole('listitem').all();
	expect(list.length).toBe(6);

	let channelViewerCount = await page.getByRole('link', { name: 'Cyqop ARC Raiders' }).locator(".viewer-count").innerText();
	expect(channelViewerCount).toBe("631");

	await page.evaluate(({conf, channelsRef}) => {
		let deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

		let chConf = deepClone(channelsRef);
		chConf[3].viewer_count = 222;
		(window as any).__onMessageCallback({
			type: "UPDATE_STREAM_INFO",
			data: chConf
		})
	}, {conf, channelsRef});

	channelViewerCount = await page.getByRole('link', { name: 'Cyqop ARC Raiders' }).locator(".viewer-count").innerText();
	expect(channelViewerCount).toBe("222");
	let gameName = await page.locator('#list-10 a').filter({ hasText: 'Cyqop ARC Raiders' }).locator('.game-name').first().innerText();
	expect(gameName).toBe('ARC Raiders')
	
	await page.evaluate(({conf, channelsRef}) => {
		let deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

        let chConf = deepClone(channelsRef);
        chConf[3].isLive = false;

        (window as any).__onMessageCallback({
            type: "UPDATE_STREAM_INFO",
            data: chConf
        })
	}, {conf, channelsRef});

	const onlineChannels = await page.locator('#display-container').getByRole('link').all();
	expect(onlineChannels.length).toBe(3);
	const offlineChannel = await page.locator('#list-10 a').filter({ hasText: 'Cyqop Offline' }).locator('.viewer-count-container .offline').first().innerText();
	expect(offlineChannel).toBe('Offline');

	const channelsRef2 = deepClone(channelsRef);


	let newChannels2 = deepClone(newChannels);
	channelsRef2.push(newChannels2[0]);
	channelsRef2.push(newChannels2[1]);
	await page.evaluate(({conf, channelsRef2}) => {
		let deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

        let chConf = deepClone(channelsRef2);
        // chConf[3].isLive = false;

        (window as any).__onMessageCallback({
            type: "UPDATE_STREAM_INFO",
            data: chConf
        })
	}, {conf, channelsRef2});

	await page.pause()

	await page.getByText('allOthers').hover();

	let mainListCoord = await page.getByText('x chowh1 ARC Raiders 2.5Klist').boundingBox();
	await page.mouse.down();
	console.log(mainListCoord)
	if (mainListCoord) {
		await page.mouse.move(
			mainListCoord.x + mainListCoord.width/2,
			mainListCoord.y + mainListCoord.height - 12,
			{ steps: 20 }
		)
		await page.mouse.move(
			mainListCoord.x + mainListCoord.width/2,
			mainListCoord.y + mainListCoord.height + 69 ,
			{ steps: 20 }
		)
	}
	await page.mouse.up();

	await page.waitForTimeout(100);




	newChannels2 = deepClone(newChannels);
	channelsRef2.push(newChannel);
	await page.evaluate(({conf, channelsRef2}) => {
		let deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

        let chConf = deepClone(channelsRef2);
        // chConf[3].isLive = false;

        (window as any).__onMessageCallback({
            type: "UPDATE_STREAM_INFO",
            data: chConf
        })
	}, {conf, channelsRef2});


	await page.pause()
});
