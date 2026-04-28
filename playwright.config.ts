import { defineConfig ,devices} from '@playwright/test';

export default defineConfig({
	webServer: { command: 'npm run build && npm run preview', port: 4173 },
	testDir: 'e2e/features',
 	reporter:  [
        ['html'],
        ['line'],
    ],
	projects: [
		{
      		name: 'chromium',
			use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1920, height: 1000 } },
		},
		// { doesn't seem to work
      	// 	name: 'chromium-beta',
		// 	use: { ...devices['Desktop Chrome'], channel: 'chrome-beta', viewport: { width: 1920, height: 1000 } },
		// },
		{
      		name: 'msedge',
			use: { ...devices['Desktop Chrome'], channel: 'msedge', viewport: { width: 1920, height: 1000 } },
		},
		{
      		name: 'firefox',
			use: { ...devices['Desktop Safari'], viewport: { width: 1920, height: 1000 } },
		},
		{
      		name: 'webkit',
			use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1000 } },
		},
	],
	use: {
		trace: 'on',
		screenshot: 'on',
		video: 'on'
		// trace: 'on-failure',      // capture la trace si le test échoue
		// screenshot: 'on-failure', // screenshot si échec
		// video: 'on-failure',      // video si échec

    	// viewport: null,
	}
});
