import { Given, When, Then, Before, setDefaultTimeout, After } from '@cucumber/cucumber';
import { chromium, Browser, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { PopupPage } from '../pages/popup.page';


let browser: Browser;
let page: Page;
let popupPage: PopupPage;


Before(async () => {
  browser = await chromium.launch();
  page = await browser.newPage();
  popupPage = new PopupPage(page);
});

Given('je suis sur la page principale', async () => {
  await page.goto('http://localhost:4173');
});

Given('je vois l\'élément {string} dans la liste racine', async (itemText: string) => {
    let dragSourceText = itemText;
    await page.goto('src/iframe/config-popup.html');

	const loadingLogo = await page.locator('.loading-wrapper').first().innerHTML();
	expect(loadingLogo).toContain('<div class="loading-overlay');

});









