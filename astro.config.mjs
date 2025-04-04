import { defineConfig } from "astro/config";
import path from "node:path";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import Icons from "unplugin-icons/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	integrations: [svelte(), mdx()],
	site: "https://elianiva.my.id",
	markdown: {
		shikiConfig: {
			theme: "rose-pine-dawn",
		},
	},
	vite: {
		plugins: [Icons({ compiler: "svelte" }), tailwindcss()],
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
