import { mdsvex } from "mdsvex";
import adapter from "@sveltejs/adapter-static";
import sveltePreprocess from "svelte-preprocess";
import mdsvexConfig from "./mdsvex.config.js";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: [".svelte", ...mdsvexConfig.extensions],
	preprocess: [mdsvex(mdsvexConfig), sveltePreprocess()],
	kit: {
		adapter: adapter(),
		inlineStyleThreshold: 1024,
	},
};

export default config;
