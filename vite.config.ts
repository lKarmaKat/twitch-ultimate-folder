import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = mode !== 'production'
  console.log("CMD", command)
  console.log("MODE", mode)
  const locales = ['en', 'fr', 'es', 'de', 'it', 'pt_BR', 'pt_PT', 'hr', 'ru', 'pl', 'sv', 'fi', 'no', 'el', 'bg']
  const staticCopyTargets = [
    { src: 'public/manifest.json', dest: '.' },
    ...locales.map(locale => ({ src: `public/_locales/${locale}/messages.json`, dest: `_locales/${locale}` })),
    { src: 'src/iframe/*.css', dest: 'assets' },
    { src: 'src/assets/*.{css,png,gif,webm,mp4}', dest: 'assets' },
    { src: 'src/assets/selected_icons/*.png', dest: 'assets' },
    ...(isDev ? [{ src: 'e2e/twitch-copy.html', dest: 'assets' }] : [])
  ]

  return {
    base: './',
    plugins: [
      svelte({
        compilerOptions: {
          css: 'injected',
          runes: true,
          dev: isDev
        }
      }),
      viteStaticCopy({ targets: staticCopyTargets })
    ],
    build: {
      cssCodeSplit: true,
      sourcemap: isDev ? 'inline' : false,
      minify: isDev ? false : 'terser',
      rollupOptions: {
        input: {
          background: 'src/service_worker/background.ts',
          content_script: 'src/content_script/index.js',
          popup_hmtl: 'src/iframe/config-popup.html',
          help_html: 'src/iframe/help.html',
          sidebar_inject: 'src/svelte/injects/sidebar_inject.js',
          // title_inject: 'src/svelte/injects/title_inject.js',
          popup: 'src/action_popup/popup.html',
          popup_inject: 'src/svelte/injects/popup_inject.js',
          help_inject: 'src/svelte/injects/help_inject.js'
        },
        output: {
          entryFileNames: '[name].js',
          assetFileNames: 'assets/[name][extname]',
          chunkFileNames: 'assets/[name].js'
        }
      }
    },
    server: {
      open: 'assets/twitch-copy.html'
    }
  }
})
