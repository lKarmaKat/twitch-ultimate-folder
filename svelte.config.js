import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),
    // sveltePreprocess({
    //         typescript: {
    //             compilerOptions: {
    //                 noImplicitAny: false
    //             }
    //         },
    //         scss: {
    //             prependData: `
    //                 @import 'src/assets/scss/global.scss';
    //                 @import 'src/assets/scss/variables.scss';
    //             `
    //         }
    //     })

  // ],
}
