import { defineConfig } from "astro/config";
import Unocss from "unocss/astro";
import path from "node:path";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
	integrations: [Unocss(), svelte(), mdx()],
	site: 'https://elianiva.my.id',
	trailingSlash: "always",
	vite: {
		resolve: {
			alias: {
				"~/*": path.resolve("src"),
			},
		},
		ssr: {
			external: ["svgo"],
		},
	},
});
