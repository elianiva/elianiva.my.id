import { mdsvex } from "mdsvex";
import mdsvexConfig from "./mdsvex.config.js";
import adapter from "@sveltejs/adapter-static";
import sveltePreprocess from "svelte-preprocess";
import Icons from "unplugin-icons/vite";
import Unocss from "unocss/vite";

/** @type {import('@sveltejs/kit').Config} */
export default {
  extensions: [".svelte", ...mdsvexConfig.extensions],
  preprocess: [mdsvex(mdsvexConfig), sveltePreprocess()],
  kit: {
    adapter: adapter(),
    inlineStyleThreshold: 1024,
    prerender: {
      enabled: true
    },
    vite: {
      plugins: [Icons({ compiler: "svelte" }), Unocss()],
    },
  },
};
