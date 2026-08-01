import { expect, test, Page, Locator } from '@playwright/test';
import { PopupPage } from '../pages/popup.page';
import { config, channelsRef } from '../const';
import * as CST from '../../src/constantes';

let popupPage: PopupPage;
let deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

function wrap(c: any) {
	return { userId: 0, currentConfig: 'liste principale', configsList: [c] };
}

// Root holding two sibling lists, "10" open on startup, both openable by click.
function confTwoLists(exclusive: boolean, chevron: boolean) {
	let c = deepClone(config);
	c['20'] = deepClone(c['10']);
	c['20'].id = 'list 20';
	c['20'].name = 'list 20';
	c['20'].items = [
		{ id: '11716864220691', channel_id: '117168642' },
		{ id: '10545868269037', channel_id: '105458682' }
	];
	c['10'].behavior = { 0: true, 1: false, 2: true };
	c['20'].behavior = { 0: false, 1: false, 2: true };
	c['10'].type[CST.TYPE_CHEVRON] = chevron;
	c['20'].type[CST.TYPE_CHEVRON] = chevron;
	c.rootList.type[CST.TYPE_EXCLUSIVE] = exclusive;
	c.rootList.items = [
		{ id: 10, type: CST.TYPE_LIST },
		{ id: 20, type: CST.TYPE_LIST }
	];
	return wrap(c);
}

// A labelled separator between two channels, and a trailing one with nothing
// left under it.
function confWithSeparators() {
	let c = deepClone(config);
	c.rootList.items = [
		{ id: '11716864220691', channel_id: '117168642' },
		{ id: 'sep1', type: CST.TYPE_SEPARATOR, name: 'En vrac' },
		{ id: '10545868269037', channel_id: '105458682' },
		{ id: 'sep2', type: CST.TYPE_SEPARATOR, name: 'Orphelin' }
	];
	return wrap(c);
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
				connect: (...args: any[]) => {
					const info = args.length > 1 ? args[1] : args[0];
					const port = {
						onMessage: {
							addListener: (callback: (msg: any) => void) => {
								(window as any).__portCallbackMap ??= {};
								(window as any).__portCallbackMap[info.name] = callback;
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

function display(page: Page) {
	return page.frameLocator('#iframe-rem iframe').locator('#display-container.display-wrapper');
}

function nested(page: Page, index: number) {
	const list = display(page).locator('.nested-list > .list-container').nth(index);
	return {
		container: list,
		header: list.locator(':scope > .list-header'),
		bodyInner: list.locator(':scope > .list-body > div')
	};
}

// The body is a 0fr/1fr grid with overflow hidden -> collapsed means zero height.
async function isOpen(target: { bodyInner: Locator }) {
	const box = await target.bodyInner.boundingBox();
	return (box?.height ?? 0) > 0;
}

async function setup(page: Page, conf: any) {
	await popupPage.sendDefaultConf(conf, channelsRef);
	await popupPage.sendAuth(CST.AUTH_READY);
	await display(page).waitFor();
	await page.waitForTimeout(700); // grid-template-rows transition is .5s
}

test('exclusive: opening a sibling closes the one already open', async ({ page }) => {
	await setup(page, confTwoLists(true, false));
	expect(await isOpen(nested(page, 0))).toBe(true);
	expect(await isOpen(nested(page, 1))).toBe(false);

	await nested(page, 1).header.click();
	await page.waitForTimeout(700);
	expect(await isOpen(nested(page, 0))).toBe(false);
	expect(await isOpen(nested(page, 1))).toBe(true);

	// clicking the open one closes it without opening anything else
	await nested(page, 1).header.click();
	await page.waitForTimeout(700);
	expect(await isOpen(nested(page, 0))).toBe(false);
	expect(await isOpen(nested(page, 1))).toBe(false);
});

test('without the option both siblings can be open at once', async ({ page }) => {
	await setup(page, confTwoLists(false, false));
	await nested(page, 1).header.click();
	await page.waitForTimeout(700);
	expect(await isOpen(nested(page, 0))).toBe(true);
	expect(await isOpen(nested(page, 1))).toBe(true);
});

test('chevron: drawn only when the option is on, and turns with the list', async ({ page }) => {
	await setup(page, confTwoLists(false, false));
	await expect(nested(page, 0).header.locator('.header-chevron')).toHaveCount(0);

	await setup(page, confTwoLists(false, true));
	const chevron = nested(page, 0).header.locator('.header-chevron');
	await expect(chevron).toHaveCount(1);
	// list "10" is open on startup: the chevron carries the open state
	await expect(chevron).toHaveClass(/extended/);

	await nested(page, 0).header.click();
	await page.waitForTimeout(700);
	await expect(chevron).not.toHaveClass(/extended/);
});

test('tooltip: title on the first line, category on the second', async ({ page }) => {
	await setup(page, confTwoLists(false, false));
	const frame = page.frameLocator('#iframe-rem iframe');

	await nested(page, 0).bodyInner.locator('a').first().hover();
	await expect(frame.locator('#tooltip .tt-title')).toHaveText(channelsRef[2][1].title);
	await expect(frame.locator('#tooltip .tt-game')).toHaveText(channelsRef[2][1].game_name);

	// the bubble is torn down on leave, not left behind
	await frame.locator('#main-channels-list').hover();
	await expect(frame.locator('#tooltip')).toHaveCount(0);
});

test('separator: shown with its label, dropped when nothing follows it', async ({ page }) => {
	await setup(page, confWithSeparators());
	const separators = display(page).locator('.list-separator');
	await expect(separators).toHaveCount(1);
	await expect(separators.locator('.separator-label')).toHaveText('En vrac');
});
