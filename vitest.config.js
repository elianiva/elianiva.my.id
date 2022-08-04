import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import Icons from "unplugin-icons/vite";

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST }), Icons({ compiler: "svelte" })],
	test: {
		global: true,
		environment: "jsdom",
	},
});
