import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig, type BuildOptions, type PluginOption } from 'vite'
import { readFileSync } from 'node:fs'

type Browser = 'chrome' | 'firefox'

const BROWSERS: Browser[] = ['chrome', 'firefox']

/**
 * Le manifest est assemblé au build : base commune (public/manifest.json)
 * + fragment spécifique au navigateur (public/manifest.<browser>.json).
 * Firefox ne supporte pas background.service_worker et rejette key /
 * externally_connectable, d'où les deux fragments plutôt qu'un fichier unique.
 * La version vient de package.json pour n'avoir qu'un seul endroit à bumper.
 *
 * Le champ `key` du fragment Chrome doit rester la clé PUBLIQUE (SPKI). Chrome
 * hache les octets bruts de ce champ sans vérifier leur nature, donc une clé
 * privée y « fonctionne » aussi — tout en étant publiée telle quelle dans
 * dist/chrome/manifest.json. C'était le cas jusqu'ici.
 */
function buildManifest(browser: Browser): string {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  const base = JSON.parse(readFileSync('public/manifest.json', 'utf8'))
  const overrides = JSON.parse(readFileSync(`public/manifest.${browser}.json`, 'utf8'))

  return JSON.stringify({ ...base, ...overrides, version: pkg.version }, null, 2)
}

/**
 * Le build se fait en deux passes vers le meme outDir.
 *
 * `main` produit les entrees ESM (service worker, pages d'extension). `content`
 * produit le seul bundle qui doit etre du JS classique : le content script.
 * Ni Chrome ni Firefox ne savent charger un content script en module ES, or
 * celui-ci embarque desormais la sidebar Svelte — il faut donc un IIFE
 * auto-suffisant, ce que Rollup n'accepte qu'avec une entree unique.
 */
type Pass = 'main' | 'content'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = mode !== 'production'
  const browser = (process.env.TARGET_BROWSER ?? 'chrome') as Browser
  if (!BROWSERS.includes(browser)) {
    throw new Error(`TARGET_BROWSER invalide : "${browser}" (attendu : ${BROWSERS.join(' | ')})`)
  }
  const pass = (process.env.BUILD_PASS ?? 'main') as Pass
  if (pass !== 'main' && pass !== 'content') {
    throw new Error(`BUILD_PASS invalide : "${pass}" (attendu : main | content)`)
  }
  const isContentPass = pass === 'content'
  // En watch les deux passes tournent en parallele (scripts/watch.mjs) : si la
  // passe `main` vidait outDir a chaque rebuild, elle emporterait le
  // content_script.js de l'autre passe. Le nettoyage initial est fait la-bas.
  const isWatch = process.argv.includes('--watch') || process.argv.includes('-w')
  console.log("CMD", command)
  console.log("MODE", mode)
  console.log("TARGET_BROWSER", browser)
  console.log("BUILD_PASS", pass)
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

  // La passe `content` ecrit dans un outDir deja peuple par la passe `main` :
  // elle ne doit ni le vider, ni recopier les memes fichiers statiques.
  const plugins: PluginOption[] = [
    svelte({
      compilerOptions: {
        css: 'injected',
        runes: true,
        dev: isDev
      }
    }),
    ...(isContentPass ? [] : [viteStaticCopy({ targets: staticCopyTargets })])
  ]

  const rollupOptions: BuildOptions['rollupOptions'] = isContentPass
    ? {
        input: { content_script: 'src/content_script/index.js' },
        output: {
          format: 'iife' as const,
          // Un content script ne peut pas etre un module : tout doit tenir
          // dans un seul fichier, sans import ni chunk partage.
          inlineDynamicImports: true,
          entryFileNames: 'content_script.js',
          // Prefixe distinct : la passe `main` a deja ecrit dans assets/ et un
          // nom identique l'ecraserait silencieusement.
          assetFileNames: 'assets/content_[name][extname]'
        }
      }
    : {
        input: {
          background: 'src/service_worker/background.ts',
          popup_hmtl: 'src/iframe/config-popup.html',
          help_html: 'src/iframe/help.html',
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

  return {
    base: './',
    // Sinon Vite copie tout public/ tel quel, donc les DEUX fragments de
    // manifest, dans les DEUX dist/ : manifest.chrome.json se retrouvait
    // publie dans le paquet Firefox et inversement. Le manifest final est
    // deja produit par buildManifest() ci-dessous, et _locales a sa propre
    // cible de copie : plus rien n'a besoin de publicDir.
    publicDir: false,
    plugins,
    build: {
      // Un dossier par cible : chaque navigateur charge son propre unpacked
      // et la CI zippe les deux indépendamment.
      outDir: `dist/${browser}`,
      // Seule la premiere passe repart d'un dossier propre, et jamais en watch.
      emptyOutDir: !isContentPass && !isWatch,
      cssCodeSplit: true,
      sourcemap: isDev ? 'inline' : false,
      minify: isDev ? false : 'terser',
      rollupOptions
    },
    server: {
      open: 'assets/twitch-copy.html'
    }
  }
})
