import { mdsvex } from "mdsvex";
import mdsvexConfig from "./mdsvex.config.js";
import adapterVercel from "@sveltejs/adapter-vercel";
import sveltePreprocess from "svelte-preprocess";
import Icons from "unplugin-icons/vite";
import Unocss from "unocss/vite";

/** @type {import('@sveltejs/kit').Config} */
export default {
  extensions: [".svelte", ...mdsvexConfig.extensions],
  preprocess: [mdsvex(mdsvexConfig), sveltePreprocess()],
  kit: {
    adapter: adapterVercel(),
    inlineStyleThreshold: 1024,
    vite: {
      plugins: [Icons({ compiler: "svelte" }), Unocss()],
    },
  },
};
