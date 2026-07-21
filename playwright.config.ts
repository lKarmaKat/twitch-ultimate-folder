import { defineConfig ,devices} from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
	webServer: {
		command: 'npm run build:dev && npm run preview',
		port: 4173,
		// le build vite dépasse les 60s par défaut sur un runner CI
		timeout: 120_000,
	},
	testDir: 'e2e/features',
 	reporter:  [
        ['html', { open: 'never' }],
        ['line'],
    ],
	// un test.only oublié ne doit pas faire passer la CI en vert
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	projects: [
		{
      		name: 'chromium',
			use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1000 } },
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
			use: { ...devices['Desktop Firefox'], viewport: { width: 1920, height: 1000 } },
		},
		{
      		name: 'webkit',
			use: { ...devices['Desktop Safari'], viewport: { width: 1920, height: 1000 } },
		},
	],
	use: {
		// en local on capture tout ; en CI seulement les échecs, sinon le
		// rapport uploadé pèse des centaines de Mo et grignote le quota
		trace: isCI ? 'retain-on-failure' : 'on',
		screenshot: isCI ? 'only-on-failure' : 'on',
		video: isCI ? 'retain-on-failure' : 'on',

    	// viewport: null,
	}
});
