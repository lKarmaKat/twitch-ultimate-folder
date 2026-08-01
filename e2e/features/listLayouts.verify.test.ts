import { expect, test, Page } from '@playwright/test';
import { PopupPage } from '../pages/popup.page';
import { config, channelsRef } from '../const';
import * as CST from '../../src/constantes';

let popupPage: PopupPage;
let deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

function wrap(c: any) {
	return { userId: 0, currentConfig: 'liste principale', configsList: [c] };
}

// rootList -> list "5" (carries the tabs/split layout, so it keeps a real
// header) -> two children "10"/"20", one channel each. The layout can't live
// on rootList itself: rootList never renders a header, tabs/split included.
function confTwoChildren(layout: number) {
	let c = deepClone(config);
	c['5'] = deepClone(c['10']);
	c['5'].id = 'list 5';
	c['5'].name = 'list 5';
	c['5'].behavior = { 0: true, 1: false, 2: true };
	c['5'].type.layout = layout;
	c['5'].items = [
		{ id: 10, type: CST.TYPE_LIST },
		{ id: 20, type: CST.TYPE_LIST }
	];

	c['20'] = deepClone(c['10']);
	c['20'].id = 'list 20';
	c['20'].name = 'list 20';
	c['10'].items = [{ id: '11716864220691', channel_id: '117168642' }]; // chowh1
	c['20'].items = [{ id: '10545868269037', channel_id: '105458682' }]; // BobRoss
	c['10'].behavior = { 0: true, 1: false, 2: true };
	c['20'].behavior = { 0: true, 1: false, 2: true };

	c.rootList.items = [{ id: 5, type: CST.TYPE_LIST }];
	return wrap(c);
}

// A single non-root list ("10") carrying the layout under test, so its own
// header (and the overflow fold / flyout hover, which both live on it) exists.
function confSingleList(layout: number, typeOverrides: any = {}) {
	let c = deepClone(config);
	c['10'].items = [
		{ id: '11716864220691', channel_id: '117168642' }, // chowh1
		{ id: '10545868269037', channel_id: '105458682' }, // BobRoss
		{ id: '24180896992460', channel_id: '241808969' }  // AVAMind
	];
	c['10'].behavior = { 0: true, 1: false, 2: true };
	Object.assign(c['10'].type, { layout, ...typeOverrides });
	c.rootList.items = [{ id: 10, type: CST.TYPE_LIST }];
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

function flyoutAnchor(page: Page) {
	return page.frameLocator('#iframe-rem iframe').locator('.flyout-anchor');
}

function nested(page: Page, index: number) {
	const list = display(page).locator('.nested-list > .list-container').nth(index);
	return {
		container: list,
		header: list.locator(':scope > .list-header')
	};
}

async function setup(page: Page, conf: any) {
	await popupPage.sendDefaultConf(conf, channelsRef);
	await popupPage.sendAuth(CST.AUTH_READY);
	await display(page).waitFor();
	await page.waitForTimeout(700); // grid-template-rows transition is .5s
}

test('tabs: header becomes tab buttons, selecting one shows only that child', async ({ page }) => {
	await setup(page, confTwoChildren(CST.LIST_LAYOUT_TABS));
	const parent = nested(page, 0);
	const tabs = parent.header.locator('.tab');
	await expect(tabs).toHaveCount(2);

	// First child ("10" -> chowh1) shows by default.
	await expect(parent.container.locator('.card', { hasText: 'chowh1' })).toBeVisible();
	await expect(parent.container.locator('.card', { hasText: 'BobRoss' })).toHaveCount(0);

	await tabs.nth(1).click();
	await page.waitForTimeout(100);
	await expect(parent.container.locator('.card', { hasText: 'BobRoss' })).toBeVisible();
	await expect(parent.container.locator('.card', { hasText: 'chowh1' })).toHaveCount(0);
});

test('split: one column per child list, each showing its own channels', async ({ page }) => {
	await setup(page, confTwoChildren(CST.LIST_LAYOUT_SPLIT));
	const parent = nested(page, 0);
	const columns = parent.container.locator('.split-col');
	await expect(columns).toHaveCount(2);
	await expect(columns.nth(0).locator('.card', { hasText: 'chowh1' })).toBeVisible();
	await expect(columns.nth(1).locator('.card', { hasText: 'BobRoss' })).toBeVisible();
});

test('grid: channels render as avatar cards without a game-name row', async ({ page }) => {
	await setup(page, confSingleList(CST.LIST_LAYOUT_GRID));
	const cells = nested(page, 0).container.locator('.grid-cell');
	await expect(cells).toHaveCount(3);
	await expect(cells.first().locator('.game-name')).toHaveCount(0);
});

test('dock: channels render as avatar-only cells in a horizontal strip', async ({ page }) => {
	await setup(page, confSingleList(CST.LIST_LAYOUT_DOCK));
	const list = nested(page, 0);
	await expect(list.container.locator('.list-body.dock-body')).toHaveCount(1);
	const cells = list.container.locator('.dock-cell');
	await expect(cells).toHaveCount(3);
	await expect(cells.first().locator('.grid-name')).toHaveCount(0);
});

test('overflowList: only maxItems show, a fold row reveals the rest', async ({ page }) => {
	await setup(page, confSingleList(CST.LIST_LAYOUT_STACK, { maxItems: 2 }));
	const list = nested(page, 0);
	await expect(list.container.locator(':scope > .list-body .card')).toHaveCount(2);
	const more = list.container.locator('.list-overflow-more');
	await expect(more).toHaveCount(1);

	await more.click();
	await expect(list.container.locator(':scope > .list-body .card')).toHaveCount(3);
	await expect(list.container.locator('.list-overflow-more')).toHaveCount(0);
});

test('flyoutList: hovering the header opens a detached panel, leaving closes it', async ({ page }) => {
	await setup(page, confSingleList(CST.LIST_LAYOUT_FLYOUT));
	const header = nested(page, 0).header;

	await expect(flyoutAnchor(page)).toHaveCount(0);
	await header.hover();
	await expect(flyoutAnchor(page)).toHaveCount(1);
	await expect(flyoutAnchor(page).locator('.card', { hasText: 'chowh1' })).toBeVisible();

	// Move away from both the header and the panel, then wait past the grace period.
	await page.mouse.move(5, 5);
	await page.waitForTimeout(400);
	await expect(flyoutAnchor(page)).toHaveCount(0);
});
