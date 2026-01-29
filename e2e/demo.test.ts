import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/index.html');
	await expect(page.locator('.overlay-side').first()).not.toBeNull();
});
