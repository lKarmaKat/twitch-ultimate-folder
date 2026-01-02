import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.',
        }
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        background: 'src/service_worker/background.ts'
      },
      output: {
        entryFileNames: (chunk) => {
          return chunk.name === 'background' ? 'background.js' : '[name].[hash].js'
        }
      }
    }
  },
})
