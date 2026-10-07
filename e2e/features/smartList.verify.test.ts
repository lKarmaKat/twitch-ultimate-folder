import { expect, test, Page } from '@playwright/test';
import { PopupPage } from '../pages/popup.page';
import * as CST from '../../src/constantes';

let popupPage: PopupPage;

function wrap(c: any) {
	return { userId: 0, currentConfig: 'liste principale', configsList: [c] };
}

function makeList(overrides: any = {}) {
	return { ...CST.createNewList(), ...overrides };
}

// Two channels share a game id (a smartList "by game" match), one plays
// something else, one is offline (never matches any rule).
const smartChannelsRef = [
	['117168642', {
		id: '117168642', channel_id: '117168642', channel_name: 'chowh1', isLive: true,
		game_id: '509658', game_name: 'ARC Raiders', language: 'fr',
		started_at: new Date(Date.now() - 5 * 60000).toISOString(),
		viewer_count: 2492, profile_image_url: '../../assets/profil.png', title: 'raiding'
	}],
	['91122178', {
		id: '91122178', channel_id: '91122178', channel_name: 'Cyqop', isLive: true,
		game_id: '509658', game_name: 'ARC Raiders', language: 'fr',
		started_at: new Date(Date.now() - 60 * 60000).toISOString(),
		viewer_count: 631, profile_image_url: '../../assets/profil.png', title: 'raiding too'
	}],
	['241808969', {
		id: '241808969', channel_id: '241808969', channel_name: 'AVAMind', isLive: true,
		game_id: '509642', game_name: "Baldur's Gate 3", language: 'en',
		viewer_count: 3361, profile_image_url: '../../assets/profil.png', title: 'bg3'
	}],
	['105458682', {
		id: '105458682', channel_id: '105458682', channel_name: 'BobRoss', isLive: true,
		game_id: '000001', game_name: 'Art', language: 'en',
		viewer_count: 675, profile_image_url: '../../assets/profil.png', title: 'painting'
	}],
	['999999999', {
		id: '999999999', channel_id: '999999999', channel_name: 'OfflineOne', isLive: false,
		profile_image_url: '../../assets/profil.png'
	}]
];

// list "10": smartList by game (matches chowh1 + Cyqop), stored sort forced to
// custom on purpose to prove effectiveSort overrides it. Nests list "30".
// list "20": a plain manual list with chowh1 placed by hand too (duplicate ok).
// list "30": a plain manual list with BobRoss, nested under the smartList.
function confSmartByGame() {
	const smart = makeList({
		id: 'list10', name: 'ARC Raiders',
		source: { kind: CST.SOURCE_KIND_GAME, game_id: '509658', game_name: 'ARC Raiders', language: null, freshMinutes: 10 },
		sort: CST.CUSTOM_SORT,
		items: [{ id: 30, type: CST.TYPE_LIST }]
	});
	smart.type.viewerCountType = 4; // withTotalCount -> renders "N/M" in the header
	const manual = makeList({ id: 'list20', name: 'Manual', items: [{ id: 'x1', channel_id: '117168642' }] });
	const nested = makeList({ id: 'list30', name: 'Nested', items: [{ id: 'x2', channel_id: '105458682' }] });
	const rootList = makeList({
		id: 'rootList', name: 'liste principale',
		items: [{ id: 10, type: CST.TYPE_LIST }, { id: 20, type: CST.TYPE_LIST }]
	});
	return wrap({ rootList, '10': smart, '20': manual, '30': nested });
}

// Three categories in the cycle, the last one with nobody live: the list shows
// one at a time and never skips the empty one.
function confSmartCycle(games: any[]) {
	const smart = makeList({
		id: 'list10', name: 'Watch list',
		source: { kind: CST.SOURCE_KIND_GAME, games, game_id: games[0]?.id ?? null, game_name: games[0]?.name ?? null, language: null, freshMinutes: 10 }
	});
	const rootList = makeList({ id: 'rootList', name: 'liste principale', items: [{ id: 10, type: CST.TYPE_LIST }] });
	return wrap({ rootList, '10': smart });
}

const cycleGames = [
	{ id: '509658', name: 'ARC Raiders' },
	{ id: '509642', name: "Baldur's Gate 3" },
	{ id: '000009', name: 'Trackmania' }
];

function confSmartByLanguage() {
	const smart = makeList({
		id: 'list10', name: 'English',
		source: { kind: CST.SOURCE_KIND_LANGUAGE, game_id: null, game_name: null, language: 'en', freshMinutes: 10 }
	});
	const rootList = makeList({ id: 'rootList', name: 'liste principale', items: [{ id: 10, type: CST.TYPE_LIST }] });
	return wrap({ rootList, '10': smart });
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
						onMessage: { addListener: (callback: (msg: any) => void) => {
							(window as any).__portCallbackMap ??= {};
							(window as any).__portCallbackMap[info.name] = callback;
						} },
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

// `.nested-list > .list-container` matches every level (a smartList's own
// nested sub-list included), so containers are picked by their OWN header
// title (Playwright's `:has(> ...)`, not a text search over the whole
// subtree) — a smartList row can legitimately show a duplicated channel whose
// game-name label contains another list's title text (e.g. "ARC Raiders").
function listByTitle(page: Page, title: string) {
	return display(page).locator(`.nested-list > .list-container:has(> .list-header .list-title:has-text("${title}"))`);
}

async function setup(page: Page, conf: any, channelsRef: any) {
	await popupPage.sendDefaultConf(conf, channelsRef);
	await popupPage.sendAuth(CST.AUTH_READY);
	await display(page).waitFor();
	await page.waitForTimeout(700);
}

test('smartList by game: only matching channels show, sorted by viewers regardless of stored sort', async ({ page }) => {
	await setup(page, confSmartByGame(), smartChannelsRef);
	const list = listByTitle(page, 'ARC Raiders');

	// direct children only: the nested sub-list (BobRoss) renders in its own
	// container, it must not be swept into this list's own channel rows.
	const ownChannels = list.locator(':scope > .list-body > div > .channel-overlay');
	await expect(ownChannels).toHaveCount(2);
	await expect(ownChannels.nth(0)).toContainText('chowh1'); // 2492 viewers, first
	await expect(ownChannels.nth(1)).toContainText('Cyqop'); // 631 viewers, second

	// header badge: "2/2", computed from the rule match, not from `items` (which
	// only holds the nested sub-list reference for this smartList).
	await expect(list.locator(':scope > .list-header .counter')).toHaveText(/2\s*\/\s*2/);
});

test('smartList: nested sub-list survives and a manually placed duplicate still renders', async ({ page }) => {
	await setup(page, confSmartByGame(), smartChannelsRef);
	const smart = listByTitle(page, 'ARC Raiders');
	const manual = listByTitle(page, 'Manual');

	// BobRoss lives in the nested list "30" under the smartList.
	await expect(smart.locator('.nested-list .channel-overlay')).toContainText('BobRoss');

	// chowh1 is placed manually in list "20" AND matched by the game rule in
	// list "10": a smartList ignores where a channel is already placed.
	await expect(manual.locator(':scope > .list-body > div > .channel-overlay')).toContainText('chowh1');
});

// The cycle renames the header as it goes, so listByTitle() would stop
// matching after a click: the only list of this config is located structurally.
function onlyList(page: Page) {
	return display(page).locator('.nested-list > .list-container');
}

test('category cycle: the arrows show one category at a time, rank and badge follow', async ({ page }) => {
	await setup(page, confSmartCycle(cycleGames), smartChannelsRef);
	const list = onlyList(page);
	const header = list.locator(':scope > .list-header');
	const ownChannels = list.locator(':scope > .list-body > div > .channel-overlay');

	// The category name takes the header over from the list name ("Watch list").
	await expect(header.locator('.list-title')).toHaveText('ARC Raiders');
	await expect(header.locator('.cycle-rank')).toHaveText('1/3');
	await expect(ownChannels).toHaveCount(2);
	await expect(header.locator('.counter')).toHaveText(/2\s*live/);

	await header.locator('.cycle-btn').nth(1).click();
	await expect(header.locator('.list-title')).toHaveText("Baldur's Gate 3");
	await expect(header.locator('.cycle-rank')).toHaveText('2/3');
	await expect(ownChannels).toHaveCount(1);
	await expect(ownChannels.nth(0)).toContainText('AVAMind');

	// Backwards from the first category wraps to the last one.
	await header.locator('.cycle-btn').nth(0).click();
	await expect(header.locator('.cycle-rank')).toHaveText('1/3');
	await header.locator('.cycle-btn').nth(0).click();
	await expect(header.locator('.cycle-rank')).toHaveText('3/3');
});

test('category cycle: an empty category is shown, not skipped', async ({ page }) => {
	await setup(page, confSmartCycle(cycleGames), smartChannelsRef);
	const list = onlyList(page);
	const header = list.locator(':scope > .list-header');

	await header.locator('.cycle-btn').nth(0).click(); // wraps to Trackmania
	await expect(header.locator('.cycle-rank')).toHaveText('3/3');
	await expect(list.locator('.category-empty')).toContainText('Trackmania');
	await expect(list.locator(':scope > .list-body > div > .channel-overlay')).toHaveCount(0);
});

test('category cycle: auto rotation moves to the next category on its own', async ({ page }) => {
	const conf = confSmartCycle(cycleGames);
	conf.configsList[0]['10'].source.autoRotate = true;
	conf.configsList[0]['10'].source.rotateSeconds = CST.MIN_ROTATE_SECONDS;
	await setup(page, conf, smartChannelsRef);
	const header = onlyList(page).locator(':scope > .list-header');

	await expect(header.locator('.cycle-rank')).toHaveText('1/3');
	await expect(header.locator('.cycle-rank')).toHaveText('2/3', { timeout: 8000 });
});

test('a single category keeps the list name and shows no cycle control', async ({ page }) => {
	await setup(page, confSmartCycle([cycleGames[0]]), smartChannelsRef);
	const list = listByTitle(page, 'Watch list');

	await expect(list.locator(':scope > .list-header .cycle-stepper')).toHaveCount(0);
	await expect(list.locator(':scope > .list-body > div > .channel-overlay')).toHaveCount(2);
});

test('smartList by language: matches only live channels streaming in that language', async ({ page }) => {
	await setup(page, confSmartByLanguage(), smartChannelsRef);
	const list = listByTitle(page, 'English');
	const ownChannels = list.locator(':scope > .list-body > div > .channel-overlay');

	// AVAMind and BobRoss both stream in "en" (chowh1/Cyqop are "fr", OfflineOne
	// has no language: never live, never matches any rule).
	await expect(ownChannels).toHaveCount(2);
	await expect(ownChannels.nth(0)).toContainText('AVAMind'); // 3361 viewers, first
	await expect(ownChannels.nth(1)).toContainText('BobRoss'); // 675 viewers, second
});

function popupFrame(page: Page) {
	return page.frameLocator('#iframe-rem iframe');
}

function configList(page: Page, listId: string) {
	return popupFrame(page).locator(`#config-list #list-${listId}`);
}

function configItems(page: Page, listId: string) {
	return configList(page, listId).locator(':scope > .list-body > section > div:is(.nested-list, .channel)');
}

// list "20" (manual): a channel, a separator and a sub-list holding a channel.
// list "10" (smartList by game, saved before kind changes emptied it): still nests list "30".
function confManualAndLegacySmart() {
	const conf = confSmartByGame();
	const lists = conf.configsList[0] as any;
	lists['20'].items.push({ id: 'sep1', type: CST.TYPE_SEPARATOR, name: '' }, { id: 40, type: CST.TYPE_LIST });
	lists['40'] = makeList({ id: 'list40', name: 'Inner', items: [{ id: 'x3', channel_id: '91122178' }] });
	return conf;
}

async function openList(page: Page, listId: string) {
	await configList(page, listId).locator(':scope > .list-header .list-title').click();
	await popupFrame(page).locator('.source-editor').waitFor();
}

async function pickContentKind(page: Page, label: string) {
	const row = popupFrame(page).locator('.source-editor > .row').first();
	await row.locator('.trigger').click();
	await row.locator('.menu .item').filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) }).click();
}

test('config: a smartList cannot receive lists or separators, a manual list can', async ({ page }) => {
	await setup(page, confManualAndLegacySmart(), smartChannelsRef);
	const frame = popupFrame(page);

	await expect(frame.locator('#add-list-10')).toBeDisabled();
	await expect(frame.locator('#add-separator-10')).toBeDisabled();
	await expect(frame.locator('#add-list-20')).toBeEnabled();
	await expect(frame.locator('#add-separator-20')).toBeEnabled();
});

test('config: turning a manual list into a smartList empties it, sub-lists included', async ({ page }) => {
	await setup(page, confManualAndLegacySmart(), smartChannelsRef);
	await expect(configItems(page, '20')).toHaveCount(3);

	await openList(page, '20');
	await pickContentKind(page, 'By game');

	await expect(configItems(page, '20')).toHaveCount(0);
	await expect(popupFrame(page).locator('#add-list-20')).toBeDisabled();
	await expect(popupFrame(page).locator('#add-separator-20')).toBeDisabled();
});

test('config: changing the content type of a smartList empties it too', async ({ page }) => {
	await setup(page, confManualAndLegacySmart(), smartChannelsRef);
	await expect(configItems(page, '10')).toHaveCount(1);

	await openList(page, '10');
	await pickContentKind(page, 'By language');

	await expect(configItems(page, '10')).toHaveCount(0);
});

test('config: picking the content type already selected keeps the list as it is', async ({ page }) => {
	await setup(page, confManualAndLegacySmart(), smartChannelsRef);

	await openList(page, '10');
	await pickContentKind(page, 'By game');

	await expect(configItems(page, '10')).toHaveCount(1);
});

test('config: putting a smartList back on manual does not bring its content back', async ({ page }) => {
	await setup(page, confManualAndLegacySmart(), smartChannelsRef);

	await openList(page, '20');
	await pickContentKind(page, 'By game');
	await pickContentKind(page, 'Manual');

	await expect(configItems(page, '20')).toHaveCount(0);
	await expect(popupFrame(page).locator('#add-list-20')).toBeEnabled();
});
