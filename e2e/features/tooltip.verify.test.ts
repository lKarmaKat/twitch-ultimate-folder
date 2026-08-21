import { expect, test, Page } from '@playwright/test';
import { PopupPage } from '../pages/popup.page';
import { config, channelsRef, newChannel } from '../const';
import * as CST from '../../src/constantes';

let popupPage: PopupPage;
let deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

// The "all other channels" entry is the only one that renders offline channels,
// so a card stays mounted across an offline -> live transition.
function confWithAllOthers() {
	let c = deepClone(config);
	c.rootList.items.push(deepClone(CST.ALL_OTHER_CHANNELS_ELEMENT));
	return { userId: 0, currentConfig: 'liste principale', configsList: [c] };
}

// robi is the only channel absent from the config, so it is the only one the
// all-others block picks up.
function offlineRef() {
	return [...deepClone(channelsRef), deepClone(newChannel)];
}

function liveRef(title: string) {
	const ref = offlineRef();
	Object.assign(ref[ref.length - 1][1], {
		isLive: true,
		title,
		game_name: 'ARC Raiders',
		viewer_count: 42
	});
	return ref;
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

function tooltip(page: Page) {
	return page.frameLocator('#iframe-rem iframe').locator('#custom-tooltip #tooltip');
}

function robiCard(page: Page) {
	return display(page).locator('.card', { hasText: 'robi' });
}

async function setup(page: Page, ref: any) {
	await popupPage.sendDefaultConf(confWithAllOthers(), ref);
	await popupPage.sendAuth(CST.AUTH_READY);
	await display(page).waitFor();
	await page.waitForTimeout(700); // grid-template-rows transition is .5s
}

test('a channel going live while already rendered gets its title tooltip', async ({ page }) => {
	await setup(page, offlineRef());
	const card = robiCard(page);
	await expect(card).toBeVisible();
	// The card must survive the transition, or the action would be recreated and
	// the regression this test guards would go unnoticed.
	await card.evaluate(el => el.setAttribute('data-e2e-mounted', '1'));

	// Offline: nothing to show, and no empty tooltip box either.
	await card.hover();
	await expect(tooltip(page)).toHaveCount(0);
	await page.mouse.move(5, 5);

	await popupPage.updateRef(liveRef('HEY DONT SHOOOOOOOOOOOT'));
	await expect(card.locator('.viewer-count')).toBeVisible();
	await expect(card).toHaveAttribute('data-e2e-mounted', '1');

	await card.hover();
	await expect(tooltip(page).locator('.tt-title')).toHaveText('HEY DONT SHOOOOOOOOOOOT');
});

test('the tooltip follows the title while it is displayed', async ({ page }) => {
	await setup(page, liveRef('first title'));
	const card = robiCard(page);

	await card.hover();
	await expect(tooltip(page).locator('.tt-title')).toHaveText('first title');

	await popupPage.updateRef(liveRef('second title'));
	await expect(tooltip(page).locator('.tt-title')).toHaveText('second title');
});

test('the tooltip closes when the channel goes offline while hovered', async ({ page }) => {
	await setup(page, liveRef('still live'));
	const card = robiCard(page);

	await card.hover();
	await expect(tooltip(page)).toHaveCount(1);

	await popupPage.updateRef(offlineRef());
	await expect(tooltip(page)).toHaveCount(0);
});
