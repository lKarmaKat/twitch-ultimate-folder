import { defineConfig ,devices} from '@playwright/test';

export default defineConfig({
	webServer: { command: 'npm run build && npm run preview', port: 4173 },
	testDir: 'e2e',
 	reporter: 'line',
	projects: [
		{
      name: 'Google Chrome',
		use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1920, height: 1000 } }, // or 'chrome-beta'
		},
	],
	use: {
		
    	viewport: null,
	}
});
