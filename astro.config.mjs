import { defineConfig, envField, passthroughImageService } from "astro/config";
import path from "node:path";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import Icons from "unplugin-icons/vite";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import remarkGfm from "remark-gfm";
import remarkWikiLink from "@flowershow/remark-wiki-link";

export default defineConfig({
	experimental: {
		liveContentCollections: true,
	},
	output: "server",
	prefetch: true,
	adapter: cloudflare({
		imageService: "passthrough",
	}),
	image: {
		service: passthroughImageService(),
	},
	integrations: [
		svelte(),
		mdx({
			remarkPlugins: [
				remarkGfm,
				[
					remarkWikiLink,
					{
						wikiLinkClassName: "wiki-link",
						pageResolver: (name) => [name.toLowerCase().replace(/\s+/g, "-")],
						hrefTemplate: (slug) => `/notes/${slug}`,
					},
				],
			],
		}),
	],
	site: "https://elianiva.my.id",
	markdown: {
		shikiConfig: {
			theme: "rose-pine-dawn",
		},
		remarkPlugins: [
			remarkGfm,
			[
				remarkWikiLink,
				{
					wikiLinkClassName: "wiki-link",
					pageResolver: (name) => [name.toLowerCase().replace(/\s+/g, "-")],
					hrefTemplate: (slug) => `/notes/${slug}`,
				},
			],
		],
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
	env: {
		schema: {
			RAINDROP_API_KEY: envField.string({
				context: "server",
				access: "secret",
			}),
			GH_TOKEN: envField.string({
				context: "server",
				access: "secret",
			}),
		},
	},
});
