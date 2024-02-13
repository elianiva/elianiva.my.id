import { defineConfig } from "astro/config";
import Unocss from "unocss/astro";
import path from "node:path";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import Icons from 'unplugin-icons/vite'

export default defineConfig({
	integrations: [Unocss(), svelte(), mdx()],
	site: "https://elianiva.my.id",
	markdown: {
		shikiConfig: {
			theme: "catppuccin-latte"
		}
	},
	vite: {
		plugins: [Icons({ compiler: "svelte" })],
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
