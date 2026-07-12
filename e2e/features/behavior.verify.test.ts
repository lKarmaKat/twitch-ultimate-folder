import { expect, test, Page } from '@playwright/test';
import { PopupPage } from '../pages/popup.page';
import { config, channelsRef } from '../const';
import * as CST from '../../src/constantes';

let popupPage: PopupPage;
let deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

// Builds a conf where nested list "10" has the given behavior flags.
function confWithBehavior(startup: boolean, hover: boolean, click: boolean) {
	let c = deepClone(config);
	c['10'].behavior = { 0: startup, 1: hover, 2: click };
	return {
		userId: 0,
		currentConfig: 'liste principale',
		configsList: [c]
	};
}

test.beforeEach(async ({ page }) => {
	popupPage = new PopupPage(page);
	await page.addInitScript(() => {
		window.chrome = {
			runtime: {
				id: 'fake-extension-id',
				getURL: (path: string) => `http://localhost:4173/${path}`,
				onMessage: {
					addListener: (callback: (msg: any) => void) => {
						(window as any).__messageListener = callback;
					},
					removeListener: () => {},
					hasListener: () => false,
					hasListeners: () => false,
					addRules: () => Promise.resolve(),
					removeRules: () => Promise.resolve(),
					getRules: () => Promise.resolve([])
				},
				sendMessage: () => Promise.resolve(),
				connect: (extId: any, type: any) => {
					const port = {
						onMessage: {
							addListener: (callback: (msg: any) => void) => {
								(window as any).__portCallbackMap ??= {};
								(window as any).__portCallbackMap[type.name] = callback;
							}
						},
						onDisconnect: { addListener: () => {} },
						postMessage: (msg: any) => {}
					};
					return port;
				}
			}
		} as any;
	});
	await page.goto('assets/twitch-copy.html');
	await page.addScriptTag({ url: 'http://localhost:4173/content_script.js' });
	await page.waitForFunction(() => (window as any).__messageListener && typeof (window as any).__messageListener === 'function');
	await page.evaluate(({ DISPLAY_POPUP }) => {
		(window as any).__messageListener({ type: DISPLAY_POPUP });
	}, { DISPLAY_POPUP: CST.DISPLAY_POPUP });
	await page.waitForSelector('#inner-iframe');
});

// The nested list ("list 10") inside the Display preview: the only one with a header.
function nestedList(page: Page) {
	const frame = page.frameLocator('#iframe-rem iframe');
	const nested = frame.locator('#display-container.display-wrapper .nested-list > .list-container');
	return {
		container: nested,
		header: nested.locator(':scope > .list-header'),
		bodyInner: nested.locator(':scope > .list-body > div')
	};
}

// The body is a 0fr/1fr grid with overflow hidden -> collapsed means a zero-height content box.
async function isOpen(page: Page) {
	const box = await nestedList(page).bodyInner.boundingBox();
	return (box?.height ?? 0) > 0;
}

async function setup(page: Page, conf: any) {
	await popupPage.sendDefaultConf(conf, channelsRef);
	await popupPage.sendAuth(true);
	await nestedList(page).header.waitFor();
	await page.waitForTimeout(700); // grid-template-rows transition is .5s
}

test('startup only: open on load, click and hover do not close it', async ({ page }) => {
	await setup(page, confWithBehavior(true, false, false));
	expect(await isOpen(page)).toBe(true);

	await nestedList(page).header.click();
	await page.waitForTimeout(700);
	expect(await isOpen(page)).toBe(true);
});

test('hover only: closed, opens while hovering, stays open over the content, closes on leave', async ({ page }) => {
	await setup(page, confWithBehavior(false, true, false));
	expect(await isOpen(page)).toBe(false);

	await nestedList(page).header.hover();
	await page.waitForTimeout(700);
	expect(await isOpen(page)).toBe(true);

	// moving from the header down into a channel of the list must keep it open
	await nestedList(page).bodyInner.locator('a').first().hover();
	await page.waitForTimeout(300);
	expect(await isOpen(page)).toBe(true);

	// leaving collapses it back
	await page.frameLocator('#iframe-rem iframe').locator('#main-channels-list').hover();
	await page.waitForTimeout(700);
	expect(await isOpen(page)).toBe(false);
});

test('click only: closed, click toggles, hover does nothing', async ({ page }) => {
	await setup(page, confWithBehavior(false, false, true));
	expect(await isOpen(page)).toBe(false);

	await nestedList(page).header.hover();
	await page.waitForTimeout(700);
	expect(await isOpen(page)).toBe(false); // hover disabled

	await nestedList(page).header.click();
	await page.waitForTimeout(700);
	expect(await isOpen(page)).toBe(true);

	await nestedList(page).header.click();
	await page.waitForTimeout(700);
	expect(await isOpen(page)).toBe(false);
});

test('startup + click: open on load, click closes it', async ({ page }) => {
	await setup(page, confWithBehavior(true, false, true));
	expect(await isOpen(page)).toBe(true);

	await nestedList(page).header.click();
	await page.waitForTimeout(700);
	expect(await isOpen(page)).toBe(false);
});

test('no behavior checked: stays closed and is not openable', async ({ page }) => {
	await setup(page, confWithBehavior(false, false, false));
	expect(await isOpen(page)).toBe(false);

	await nestedList(page).header.hover();
	await page.waitForTimeout(700);
	expect(await isOpen(page)).toBe(false);

	await nestedList(page).header.click();
	await page.waitForTimeout(700);
	expect(await isOpen(page)).toBe(false);
});

test('a config reload resets a click-opened folder back to its startup state', async ({ page }) => {
	await setup(page, confWithBehavior(false, false, true));
	await nestedList(page).header.click();
	await page.waitForTimeout(700);
	expect(await isOpen(page)).toBe(true);

	// a save/reset broadcast re-sends GET_CURRENT_CONFIGURATION
	await popupPage.sendDefaultConf(confWithBehavior(false, false, true), channelsRef);
	await page.waitForTimeout(700);
	expect(await isOpen(page)).toBe(false);
});

test('a streams refresh (6s poller) does not collapse a click-opened folder', async ({ page }) => {
	await setup(page, confWithBehavior(false, false, true));
	await nestedList(page).header.click();
	await page.waitForTimeout(700);
	expect(await isOpen(page)).toBe(true);

	await popupPage.updateRef(channelsRef);
	await page.waitForTimeout(700);
	expect(await isOpen(page)).toBe(true);
});
