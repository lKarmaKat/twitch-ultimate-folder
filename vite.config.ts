// import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import webExtension from 'vite-plugin-web-extension'
import { defineConfig } from 'vitest/config';
import { expect, test } from 'vitest';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    svelte({
      compilerOptions: {
        css: 'injected',
        runes: true,
        dev: true
      }
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.',
        },{
          src: 'src/iframe/iframe.css',
          dest: 'assets'
        },{
          src: 'src/iframe/sidebar.css',
          dest: 'assets'
        },{
          src: 'src/iframe/clair.css',
          dest: 'assets'
        },{
          src: 'src/iframe/sombre.css',
          dest: 'assets'
        },{
          src: 'src/assets/dark_channel.css',
          dest: 'assets'
        },{
          src: 'src/assets/light_channel.css',
          dest: 'assets'
        }, {
          src: 'src/assets/profil.png',
          dest: 'assets'
        }, {
          src: 'e2e/mock-twitch.html',
          dest: 'assets'
        }, {
          src: 'e2e/twitch-copy.html',
          dest: 'assets'
        }
      ]
    })
  ],
  build: {
    cssCodeSplit: true,
    sourcemap: 'inline',
    minify: false,
    rollupOptions: {
      input: {
        background: 'src/service_worker/background.ts',
        content_script: 'src/content_script/index.js',
        popup_hmtl: 'src/iframe/config-popup.html',
        sidebar_inject: 'src/svelte/injects/sidebar_inject.js',
        title_inject: 'src/svelte/injects/title_inject.js',
        popup: 'src/action_popup/popup.html',
        popup_inject: 'src/svelte/injects/popup_inject.js'
        

      },
      output: {
        // entryFileNames: (chunk) => {
        //   // if (['background', 'content_script', 'sidebar_inject', 'popup_inject', 'popup'].includes(chunk.name)) {
        //     return `${chunk.name}.js`
        //   // }
        //   // return '[name].js'
        // },
        entryFileNames: '[name].js',

        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'assets/[name].js'


      }
    }
  },
  server: {
    open: 'assets/twitch-copy.html'
  },
	test: {
    include: ["./svelte_tests/*"],
		// If you are testing components client-side, you need to setup a DOM environment.
		// If not all your files should have this environment, you can use a
		// `// @vitest-environment jsdom` comment at the top of the test files instead.
		environment: 'jsdom'
	},
	// Tell Vitest to use the `browser` entry points in `package.json` files, even though it's running in Node
	resolve: process.env.VITEST
		? {
				conditions: ['browser']
			}
		: undefined
})
