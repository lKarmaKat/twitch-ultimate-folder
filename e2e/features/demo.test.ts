import { expect, test } from '@playwright/test';
import { beforeAll, afterAll, vi, describe, beforeEach} from 'vitest'
import { mount } from 'svelte';
import * as sinon from 'sinon';
import { addListener } from 'process';
import { PopupPage } from '../pages/popup.page';
import {config, channelsRef, newChannels, newChannel} from '../../svelte_tests/utils/const';



let popupPage: PopupPage;
let deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));


test.beforeEach(async ({ page }) => {
	popupPage = new PopupPage(page);
	await page.addInitScript(() => {
			// await page.evaluate(() => {
			// const port = {
			// 	onMessage: {
			// 		addListener: (callback: () => {}) => {
			// 			if (!(window as any).__onMessageCallback)
			// 					(window as any).__onMessageCallback = callback;
			// 		}
			// 	},
			// 	onDisconnect: {
			// 		addListener: () => {}
			// 	}
			// };



			window.chrome = {
				runtime: {
					id: 'fake-extension-id',
					getURL: (path: string) => {
						console.log("PATH " + path)
						return `http://localhost:4173/${path}`
					},
					onMessage: {
						addListener: (callback: (msg: any) => void) => {
							(window as any).__messageListener = callback;  // Stockez le callback ici
						},					removeListener: () => {},
						hasListener: () => false,
						hasListeners: () => false,
						addRules: () => Promise.resolve(),
						removeRules: () => Promise.resolve(),
						getRules: () => Promise.resolve([]),
					},
					sendMessage: () => Promise.resolve(),
					connect: (extId: any, type: any) => {
						console.log("CONNECT")
						const port = {
							onMessage: {
								addListener: (callback: (msg: any) => void) => {
									// Exposez le callback dans le contexte courant (page principale OU iframe)
									if (type.name === 'eventbus')
									(window as any).__onPortCallback = callback;
								}
							},
							onDisconnect: {
								addListener: () => {}
							},
							postMessage: (msg: any) => {}
						};
						return port;
					}
				},
			} as any;

		// });
	})
	// await page.waitForFunction(() => (window as any).__messageListener && typeof (window as any).__messageListener === 'function');
    // await page.goto('assets/mock-twitch.html');
    await page.goto('assets/twitch-copy.html');
    
	await page.addScriptTag({ url: 'http://localhost:4173/content_script.js' });  // Depuis dist/, servi par le webServer
	await page.waitForFunction(() => (window as any).__messageListener && typeof (window as any).__messageListener === 'function');
    // Déclenchez l'injection

    await page.evaluate(() => {
        if ((window as any).__messageListener) {
            (window as any).__messageListener({ type: "DISPLAY_POPUP" });
        }
    });
	// await page.goto('src/iframe/config-popup.html');
    await page.waitForSelector('#iframe');

});

test('popup has a loader until datas are sent through', async ({ page }) => {
	let loader = await popupPage.getLoaderInnerHTML();
	expect(loader).toContain('<div class="loading-overlay');

	let conf: any = {
		userId: 0,
		currentConfig: "liste principale",
		configsList: [
			deepClone(config)
		]
	}
	// await page.waitForFunction(() => (window as any).__onMessageCallback && typeof (window as any).__onMessageCallback === 'function');

	await popupPage.sendDefaultConf(conf, channelsRef);

	let mainChannelListCount = await popupPage.getMainChannelListElementCount();
	expect(mainChannelListCount).toBe(4);

	let configChannelListCount = await popupPage.getConfigChannelListElementCount();
	expect(configChannelListCount).toBe(4);

	let displayConfigListCount = await popupPage.getDisplayConfigListElementCount();
	expect(displayConfigListCount).toBe(4);
});



test.describe('popup with config already injected', async () => {
	test.beforeEach(async ({ page }) => {

		let conf: any = {
			userId: 0,
			currentConfig: "liste principale",
			configsList: [
				deepClone(config)
			]
		}
		// await page.waitForFunction(() => (window as any).__onMessageCallback && typeof (window as any).__onMessageCallback === 'function');
		await popupPage.sendDefaultConf(conf, channelsRef);
	});

	test('popup configChannelList\'s elements should have a button to remove the element', async ({ page }) => {
		await popupPage.clickRemoveList('list-10')
		expect(await popupPage.countNumberDirectSubLists('list-rootList')).toBe(1);
	});

	test('click on \'+\' sign adds a new list', async ({page}) => {
		const frame = page.frame({name: 'iframe'});
		// await frame?.evaluate

		await popupPage.clickAddList("list-10");
		let list11 = await popupPage.getListInConfigChannelList("list-11");
		expect(await list11.textContent()).toBeDefined();
	});

	test('dragging an element that is already in a list should\'nt add it', async ({ page }) => {
		await popupPage.dragElementToList('Cyqop', 'list-10', 0);
		await page.waitForTimeout(500);
		expect(await popupPage.getConfigChannelListElementCount()).toBe(4)
	})

	test('dragging to already existing shouldn\'t add, removing and adding back should add', async ({ page }) => {
		await popupPage.dragElementToList('Cyqop', 'list-10', 0);
		await page.waitForTimeout(500);
		expect(await popupPage.getConfigChannelListElementCount()).toBe(4)
		expect(await popupPage.countNumberDirectElementInList('list-10')).toBe(2)
		await popupPage.clickRemoveChannel('#remove-91122178')
		expect(await popupPage.countNumberDirectElementInList('list-10')).toBe(1)
		expect(await popupPage.getConfigChannelListElementCount()).toBe(3)
		await popupPage.dragElementToList('Cyqop', 'list-10', 0);
		expect(await popupPage.getConfigChannelListElementCount()).toBe(4)
		expect(await popupPage.countNumberDirectElementInList('list-10')).toBe(2)
	});

	test('dragging an element in the config list should add it and display it in the display list', async ({ page }) => {
		await popupPage.dragElementToList('Cyqop', 'list-rootList', 3);
		expect(await popupPage.getConfigChannelListElementCount()).toBe(5)

		expect(await popupPage.getDisplayConfigListElementCount()).toBe(5)
		page.pause();
	})

	test('new channel goes live and should be displayed', async ({page}) => {
		let channelsRef2: any[] = deepClone(channelsRef)
		channelsRef2.push(deepClone(newChannels)[0])
		channelsRef2.push(deepClone(newChannels)[1])

		let newConf = deepClone(config);

		newConf.rootList.items.push(
            {
                "id": "9123217886107",
                "channel_id": "91232178"
            })
		let conf: any = {
			userId: 0,
			currentConfig: "liste principale",
			configsList: [
				deepClone(newConf)
			]
		}
		popupPage.sendDefaultConf(conf, channelsRef2)
		expect(await popupPage.getDisplayConfigListElementCount()).toBe(5)
		expect(await popupPage.countNumberDirectElementInList('list-rootList')).toBe(4)
		let channelsDisplay = await (await popupPage.getDisplayConfigListElements()).nth(4).getByText('12K');
		expect(await channelsDisplay.textContent()).toBe('12K');
		
		let updatedRef = deepClone(channelsRef2);
		updatedRef[4].viewer_count = 6
		popupPage.updateRef(updatedRef)
		
		expect(await popupPage.getDisplayConfigListElementCount()).toBe(5)
		channelsDisplay = await (await popupPage.getDisplayConfigListElements()).nth(4).getByText('6');
		expect(await channelsDisplay.textContent()).toBe('6');

		let ur = deepClone(updatedRef)
		ur[4].isLive = false;
		popupPage.updateRef(ur)
		expect(await popupPage.getDisplayConfigListElementCount()).toBe(4)
	})


})
