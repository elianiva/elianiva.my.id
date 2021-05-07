import { mdsvex } from "mdsvex"
import mdsvexConfig from "./mdsvex.config.js"
import adapterVercel from "@sveltejs/adapter-vercel"
import sveltePreprocess from "svelte-preprocess"
import path from "path"

/** @type {import('@sveltejs/kit').Config} */
export default {
  extensions: [".svelte", ...mdsvexConfig.extensions],
  preprocess: [mdsvex(mdsvexConfig), sveltePreprocess()],
  kit: {
    adapter: adapterVercel(),
    target: "#svelte",
    vite: {
      resolve: {
        alias: [
          { find: "#/", replacement: path.join(import.meta.url, "./src") },
        ],
      },
    },
  },
}
