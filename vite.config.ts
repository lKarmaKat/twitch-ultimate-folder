import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import webExtension from 'vite-plugin-web-extension'

// https://vite.dev/config/
export default defineConfig({
  base: '',
  plugins: [
    svelte({
      compilerOptions: {
        css: 'injected'
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
          src: 'src/iframe/clair.css',
          dest: 'assets'
        },{
          src: 'src/iframe/sombre.css',
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
        sidebar_inject: 'src/svelte/injects/sidebar.js',
        popup: 'src/action_popup/popup.html',
        // popup_inject: 'src/svelte/injects/main.js',
        

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
})
