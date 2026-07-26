import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

type Browser = 'chrome' | 'firefox'

const BROWSERS: Browser[] = ['chrome', 'firefox']

/**
 * Le manifest est assemblé au build : base commune (public/manifest.json)
 * + fragment spécifique au navigateur (public/manifest.<browser>.json).
 * Firefox ne supporte pas background.service_worker et rejette key /
 * externally_connectable, d'où les deux fragments plutôt qu'un fichier unique.
 * La version vient de package.json pour n'avoir qu'un seul endroit à bumper.
 */
function buildManifest(browser: Browser): string {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  const base = JSON.parse(readFileSync('public/manifest.json', 'utf8'))
  const overrides = JSON.parse(readFileSync(`public/manifest.${browser}.json`, 'utf8'))

  return JSON.stringify({ ...base, ...overrides, version: pkg.version }, null, 2)
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = mode !== 'production'
  const browser = (process.env.TARGET_BROWSER ?? 'chrome') as Browser
  if (!BROWSERS.includes(browser)) {
    throw new Error(`TARGET_BROWSER invalide : "${browser}" (attendu : ${BROWSERS.join(' | ')})`)
  }
  console.log("CMD", command)
  console.log("MODE", mode)
  console.log("TARGET_BROWSER", browser)
  const locales = ['en', 'fr', 'es', 'de', 'it', 'pt_BR', 'pt_PT', 'hr', 'ru', 'pl', 'sv', 'fi', 'no', 'el', 'bg']
  const staticCopyTargets = [
    { src: 'public/manifest.json', dest: '.', transform: () => buildManifest(browser) },
    ...locales.map(locale => ({ src: `public/_locales/${locale}/messages.json`, dest: `_locales/${locale}` })),
    { src: 'src/iframe/*.css', dest: 'assets' },
    { src: 'src/assets/*.{css,png,gif,webm,mp4}', dest: 'assets' },
    // Le glob ci-dessus n'est pas recursif : les demos de la page d'aide vivent
    // dans un sous-dossier et ont donc besoin de leur propre cible.
    { src: 'src/assets/webm/*.{webm,mp4}', dest: 'assets/webm' },
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
      // Un dossier par cible : chaque navigateur charge son propre unpacked
      // et la CI zippe les deux indépendamment.
      outDir: `dist/${browser}`,
      emptyOutDir: true,
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
