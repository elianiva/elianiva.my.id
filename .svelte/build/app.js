import { ssr } from '@sveltejs/kit/ssr';
import root from './generated/root.svelte';
import { set_paths } from './runtime/paths.js';
import * as setup from "./setup.js";

const template = ({ head, body }) => "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\" />\n    <meta name=\"theme-color\" content=\"#20263a\" />\n    <meta name=\"supported-color-scheme\" content=\"dark light\" />\n    <meta name=\"color-scheme\" content=\"light dark\" />\n    <link\n      rel=\"alternate\"\n      type=\"application/rss+xml\"\n      href=\"https://elianiva.me/rss.xml\"\n    />\n\n    <!-- don't load global.css async because it's critical -->\n    <link href=\"/global.css\" rel=\"stylesheet\" />\n    <link rel=\"manifest\" href=\"/manifest.json\" crossorigin=\"use-credentials\" />\n    <link rel=\"icon\" type=\"image/png\" href=\"/favicon.png\" />\n\n    <!-- external resources (fonts) -->\n    <link\n      rel=\"preconnect\"\n      href=\"https://fonts.gstatic.com\"\n      crossorigin=\"anonymous\"\n    />\n    <link\n      href=\"https://fonts.googleapis.com/css2?family=Overpass&display=swap\"\n      rel=\"preload\"\n      as=\"style\"\n      onload=\"this.rel='stylesheet'\"\n    />\n    <link\n      href=\"https://dev-cats.github.io/code-snippets/JetBrainsMono.css\"\n      rel=\"preload\"\n      as=\"style\"\n      onload=\"this.rel='stylesheet'\"\n    />\n    <link\n      href=\"https://fonts.googleapis.com/css2?family=Open+Sans&display=swap\"\n      rel=\"preload\"\n      as=\"style\"\n      onload=\"this.rel='stylesheet'\"\n    />\n\n    " + head + "\n  </head>\n  <body>\n    <div id=\"svelte\">" + body + "</div>\n  </body>\n</html>\n";

set_paths({"base":"","assets":"/."});

// allow paths to be overridden in svelte-kit start
export function init({ paths }) {
	set_paths(paths);
}

const d = decodeURIComponent;
const empty = () => ({});

const components = [
	() => import("../../src/pages/index.svelte"),
	() => import("../../src/pages/project/index.svelte"),
	() => import("../../src/pages/project/brainly-scraper-ts/index.svx"),
	() => import("../../src/pages/project/old-personal-site/index.svx"),
	() => import("../../src/pages/project/nyaa-si-scraper/index.svx"),
	() => import("../../src/pages/project/covid-info-v2/index.svx"),
	() => import("../../src/pages/project/svelteception/index.svx"),
	() => import("../../src/pages/project/school-stuff/index.svx"),
	() => import("../../src/pages/project/covid-info/index.svx"),
	() => import("../../src/pages/project/kana-board/index.svx"),
	() => import("../../src/pages/project/umaru-chat/index.svx"),
	() => import("../../src/pages/project/kanaizu/index.svx"),
	() => import("../../src/pages/project/gh-job/index.svx"),
	() => import("../../src/pages/project/skaga/index.svx"),
	() => import("../../src/pages/about.svelte"),
	() => import("../../src/pages/post/index.svelte"),
	() => import("../../src/pages/post/prettify-screenshot-using-imagemagick/index.svx"),
	() => import("../../src/pages/post/comments-widget-using-utterance/index.svx"),
	() => import("../../src/pages/post/i-rebuild-my-site-using-sapper/index.svx"),
	() => import("../../src/pages/post/japanese-input-method-on-linux/index.svx"),
	() => import("../../src/pages/post/my-experience-with-svelte/index.svx"),
	() => import("../../src/pages/post/how-i-remember-heijitsu/index.svx"),
	() => import("../../src/pages/post/neovim-lua-statusline/index.svx"),
	() => import("../../src/pages/post/chrome-custom-newtab/index.svx"),
	() => import("../../src/pages/post/my-spotify-tui-setup/index.svx"),
	() => import("../../src/pages/post/trying-out-sveltekit/index.svx"),
	() => import("../../src/pages/post/making-of-my-site-2/index.svx"),
	() => import("../../src/pages/post/making-of-my-site-3/index.svx"),
	() => import("../../src/pages/post/rest-client-for-vim/index.svx"),
	() => import("../../src/pages/post/es6-array-methods/index.svx"),
	() => import("../../src/pages/post/making-of-my-site/index.svx"),
	() => import("../../src/pages/post/my-nvim-lsp-setup/index.svx"),
	() => import("../../src/pages/post/my-suckless-setup/index.svx"),
	() => import("../../src/pages/post/why-i-use-linux/index.svx"),
	() => import("../../src/pages/post/github-actions/index.svx"),
	() => import("../../src/pages/post/vim-statusline/index.svx"),
	() => import("../../src/pages/post/site-redesign/index.svx"),
	() => import("../../src/pages/post/thinkpad-x220/index.svx"),
	() => import("../../src/pages/post/defx-nvim/index.svx"),
	() => import("../../src/pages/post/2bwm/index.svx")
];



const client_component_lookup = {".svelte/build/runtime/internal/start.js":"start-f65e4750.js","src/pages/index.svelte":"pages/index.svelte-0e5685da.js","src/pages/project/index.svelte":"pages/project/index.svelte-38a4b4cc.js","src/pages/project/brainly-scraper-ts/index.svx":"pages/project/brainly-scraper-ts/index.svx-379e1206.js","src/pages/project/old-personal-site/index.svx":"pages/project/old-personal-site/index.svx-25833b6f.js","src/pages/project/nyaa-si-scraper/index.svx":"pages/project/nyaa-si-scraper/index.svx-37ac17f7.js","src/pages/project/covid-info-v2/index.svx":"pages/project/covid-info-v2/index.svx-5b81c8a9.js","src/pages/project/svelteception/index.svx":"pages/project/svelteception/index.svx-fae9431d.js","src/pages/project/school-stuff/index.svx":"pages/project/school-stuff/index.svx-78121e54.js","src/pages/project/covid-info/index.svx":"pages/project/covid-info/index.svx-2d0e36ba.js","src/pages/project/kana-board/index.svx":"pages/project/kana-board/index.svx-df51f977.js","src/pages/project/umaru-chat/index.svx":"pages/project/umaru-chat/index.svx-2bd54fd5.js","src/pages/project/kanaizu/index.svx":"pages/project/kanaizu/index.svx-d340a902.js","src/pages/project/gh-job/index.svx":"pages/project/gh-job/index.svx-eadc761a.js","src/pages/project/skaga/index.svx":"pages/project/skaga/index.svx-dffa0aae.js","src/pages/about.svelte":"pages/about.svelte-9ed5f4f9.js","src/pages/post/index.svelte":"pages/post/index.svelte-684f485b.js","src/pages/post/prettify-screenshot-using-imagemagick/index.svx":"pages/post/prettify-screenshot-using-imagemagick/index.svx-d31bb46b.js","src/pages/post/comments-widget-using-utterance/index.svx":"pages/post/comments-widget-using-utterance/index.svx-48a5890b.js","src/pages/post/i-rebuild-my-site-using-sapper/index.svx":"pages/post/i-rebuild-my-site-using-sapper/index.svx-e6e9371d.js","src/pages/post/japanese-input-method-on-linux/index.svx":"pages/post/japanese-input-method-on-linux/index.svx-f6d29c3e.js","src/pages/post/my-experience-with-svelte/index.svx":"pages/post/my-experience-with-svelte/index.svx-6b764291.js","src/pages/post/how-i-remember-heijitsu/index.svx":"pages/post/how-i-remember-heijitsu/index.svx-abac7025.js","src/pages/post/neovim-lua-statusline/index.svx":"pages/post/neovim-lua-statusline/index.svx-99cd78d9.js","src/pages/post/chrome-custom-newtab/index.svx":"pages/post/chrome-custom-newtab/index.svx-927ccd1c.js","src/pages/post/my-spotify-tui-setup/index.svx":"pages/post/my-spotify-tui-setup/index.svx-717de423.js","src/pages/post/trying-out-sveltekit/index.svx":"pages/post/trying-out-sveltekit/index.svx-4d9b22ef.js","src/pages/post/making-of-my-site-2/index.svx":"pages/post/making-of-my-site-2/index.svx-e339d59b.js","src/pages/post/making-of-my-site-3/index.svx":"pages/post/making-of-my-site-3/index.svx-16422baa.js","src/pages/post/rest-client-for-vim/index.svx":"pages/post/rest-client-for-vim/index.svx-d364f75d.js","src/pages/post/es6-array-methods/index.svx":"pages/post/es6-array-methods/index.svx-7bf55ca7.js","src/pages/post/making-of-my-site/index.svx":"pages/post/making-of-my-site/index.svx-3d6dbb8b.js","src/pages/post/my-nvim-lsp-setup/index.svx":"pages/post/my-nvim-lsp-setup/index.svx-535357a5.js","src/pages/post/my-suckless-setup/index.svx":"pages/post/my-suckless-setup/index.svx-36ec29e2.js","src/pages/post/why-i-use-linux/index.svx":"pages/post/why-i-use-linux/index.svx-6048b121.js","src/pages/post/github-actions/index.svx":"pages/post/github-actions/index.svx-4eb55e82.js","src/pages/post/vim-statusline/index.svx":"pages/post/vim-statusline/index.svx-821f6cd8.js","src/pages/post/site-redesign/index.svx":"pages/post/site-redesign/index.svx-a4e5eb3e.js","src/pages/post/thinkpad-x220/index.svx":"pages/post/thinkpad-x220/index.svx-0c609490.js","src/pages/post/defx-nvim/index.svx":"pages/post/defx-nvim/index.svx-c9fd508e.js","src/pages/post/2bwm/index.svx":"pages/post/2bwm/index.svx-ffbfbf56.js"};

const manifest = {
	assets: [{"file":"assets/logo/apexcharts.png","size":8554,"type":"image/png"},{"file":"assets/logo/chartjs.png","size":6940,"type":"image/png"},{"file":"assets/logo/deno.png","size":6360,"type":"image/png"},{"file":"assets/logo/firebase.png","size":10892,"type":"image/png"},{"file":"assets/logo/gatsby.png","size":6833,"type":"image/png"},{"file":"assets/logo/leaflet.png","size":5967,"type":"image/png"},{"file":"assets/logo/nextjs.png","size":1796,"type":"image/png"},{"file":"assets/logo/reactjs.png","size":27890,"type":"image/png"},{"file":"assets/logo/redux.png","size":28351,"type":"image/png"},{"file":"assets/logo/routify.png","size":10304,"type":"image/png"},{"file":"assets/logo/rust.png","size":6452,"type":"image/png"},{"file":"assets/logo/sapper.png","size":6155,"type":"image/png"},{"file":"assets/logo/snowpack.png","size":26535,"type":"image/png"},{"file":"assets/logo/svelte-kit.png","size":3388,"type":"image/png"},{"file":"assets/logo/svelte.png","size":3388,"type":"image/png"},{"file":"assets/logo/tailwindcss.png","size":5417,"type":"image/png"},{"file":"assets/logo/twindcss.png","size":10111,"type":"image/png"},{"file":"assets/logo/typescript.png","size":2397,"type":"image/png"},{"file":"assets/logo/vercel.png","size":3054,"type":"image/png"},{"file":"assets/opensauce/mdsvex.png","size":13412,"type":"image/png"},{"file":"assets/opensauce/tinyhttp.png","size":29057,"type":"image/png"},{"file":"assets/opensauce/yrv.png","size":4908,"type":"image/png"},{"file":"assets/post/chrome-custom-newtab/new.png","size":153525,"type":"image/png"},{"file":"assets/post/chrome-custom-newtab/newer.webp","size":36386,"type":"image/webp"},{"file":"assets/post/chrome-custom-newtab/old.png","size":51258,"type":"image/png"},{"file":"assets/post/defx-nvim/after.png","size":40641,"type":"image/png"},{"file":"assets/post/defx-nvim/before.png","size":9183,"type":"image/png"},{"file":"assets/post/defx-nvim/preview.png","size":5335,"type":"image/png"},{"file":"assets/post/github-actions/1.png","size":39740,"type":"image/png"},{"file":"assets/post/github-actions/2.png","size":4109,"type":"image/png"},{"file":"assets/post/github-actions/3.png","size":59222,"type":"image/png"},{"file":"assets/post/github-actions/4.png","size":5582,"type":"image/png"},{"file":"assets/post/github-actions/5.png","size":26976,"type":"image/png"},{"file":"assets/post/japanese-input-method-on-linux/configtool-2.png","size":44275,"type":"image/png"},{"file":"assets/post/japanese-input-method-on-linux/configtool-3.png","size":18993,"type":"image/png"},{"file":"assets/post/japanese-input-method-on-linux/configtool-4.png","size":12925,"type":"image/png"},{"file":"assets/post/japanese-input-method-on-linux/configtool.png","size":18993,"type":"image/png"},{"file":"assets/post/japanese-input-method-on-linux/cover.png","size":13582,"type":"image/png"},{"file":"assets/post/japanese-input-method-on-linux/preview.png","size":4033,"type":"image/png"},{"file":"assets/post/making-of-my-site/button.png","size":47718,"type":"image/png"},{"file":"assets/post/making-of-my-site/cover.png","size":4070,"type":"image/png"},{"file":"assets/post/making-of-my-site/finished-partial.png","size":59208,"type":"image/png"},{"file":"assets/post/making-of-my-site/mobile-finished.png","size":59669,"type":"image/png"},{"file":"assets/post/making-of-my-site/no-button.png","size":40479,"type":"image/png"},{"file":"assets/post/making-of-my-site-2/card.png","size":22955,"type":"image/png"},{"file":"assets/post/making-of-my-site-2/cover.png","size":4067,"type":"image/png"},{"file":"assets/post/making-of-my-site-2/navbar.png","size":1621,"type":"image/png"},{"file":"assets/post/making-of-my-site-2/toc.png","size":24186,"type":"image/png"},{"file":"assets/post/my-experience-with-svelte/kanaizu.png","size":22681,"type":"image/png"},{"file":"assets/post/my-experience-with-svelte/tos.png","size":67058,"type":"image/png"},{"file":"assets/post/neovim-lua-statusline/gitstatus.png","size":6004,"type":"image/png"},{"file":"assets/post/neovim-lua-statusline/result.png","size":20158,"type":"image/png"},{"file":"assets/post/prettify-screenshot-using-imagemagick/rounded.png","size":43426,"type":"image/png"},{"file":"assets/post/prettify-screenshot-using-imagemagick/square.png","size":31784,"type":"image/png"},{"file":"assets/post/site-redesign/new-tag.png","size":14748,"type":"image/png"},{"file":"assets/post/site-redesign/new.png","size":63954,"type":"image/png"},{"file":"assets/post/site-redesign/old-tag.png","size":34909,"type":"image/png"},{"file":"assets/post/site-redesign/old.png","size":30250,"type":"image/png"},{"file":"assets/post/trying-out-sveltekit/preview-2.webp","size":33630,"type":"image/webp"},{"file":"assets/post/trying-out-sveltekit/preview.webp","size":32444,"type":"image/webp"},{"file":"assets/post/trying-out-sveltekit/stop.webp","size":31238,"type":"image/webp"},{"file":"assets/post/vim-statusline/new.png","size":5575,"type":"image/png"},{"file":"assets/post/vim-statusline/old.png","size":5706,"type":"image/png"},{"file":"assets/post/why-i-use-linux/manjaro.png","size":210455,"type":"image/png"},{"file":"assets/project/brainly-scraper-ts/cover.webp","size":8242,"type":"image/webp"},{"file":"assets/project/covid-info/cover.webp","size":32040,"type":"image/webp"},{"file":"assets/project/covid-info-v2/cover.webp","size":54342,"type":"image/webp"},{"file":"assets/project/gh-job/cover.webp","size":32444,"type":"image/webp"},{"file":"assets/project/kana-board/cover.webp","size":18910,"type":"image/webp"},{"file":"assets/project/kanaizu/cover.webp","size":17784,"type":"image/webp"},{"file":"assets/project/nyaa-si-scraper/cover.webp","size":9504,"type":"image/webp"},{"file":"assets/project/nyaa-si-scraper/preview.webp","size":62550,"type":"image/webp"},{"file":"assets/project/old-personal-site/cover.webp","size":52592,"type":"image/webp"},{"file":"assets/project/school-stuff/cover.webp","size":20164,"type":"image/webp"},{"file":"assets/project/skaga/cover.webp","size":52628,"type":"image/webp"},{"file":"assets/project/svelteception/cover.webp","size":39852,"type":"image/webp"},{"file":"assets/project/umaru-chat/cover.webp","size":10976,"type":"image/webp"},{"file":"favicon.png","size":17217,"type":"image/png"},{"file":"global.css","size":3752,"type":"text/css"},{"file":"logo-192.png","size":17217,"type":"image/png"},{"file":"logo-512.png","size":80087,"type":"image/png"},{"file":"manifest.json","size":448,"type":"application/json"},{"file":"prism-night-owl.css","size":2494,"type":"text/css"},{"file":"robots.txt","size":56,"type":"text/plain"}],
	layout: () => import("../../src/pages/$layout.svelte"),
	error: () => import("../../src/pages/$error.svelte"),
	routes: [
		{
						type: 'page',
						pattern: /^\/$/,
						params: empty,
						parts: [{ id: "src/pages/index.svelte", load: components[0] }],
						css: ["assets/start-c7eab101.css", "assets/pages/index.svelte-9661a8f0.css", "assets/ProgressButton-42b56f44.css", "assets/PostCard-011f2f01.css", "assets/ProjectCard-e00cf040.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/index.svelte-0e5685da.js", "chunks/ProgressButton-a8599f0a.js", "chunks/PostCard-7862f637.js", "chunks/ProjectCard-b5b721bc.js", "chunks/Chrome-049b1c35.js"]
					},
		{
						type: 'page',
						pattern: /^\/project\/?$/,
						params: empty,
						parts: [{ id: "src/pages/project/index.svelte", load: components[1] }],
						css: ["assets/start-c7eab101.css", "assets/pages/project/index.svelte-8a40e89b.css", "assets/ProgressButton-42b56f44.css", "assets/ProjectCard-e00cf040.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/project/index.svelte-38a4b4cc.js", "chunks/ProgressButton-a8599f0a.js", "chunks/ProjectCard-b5b721bc.js", "chunks/Chrome-049b1c35.js"]
					},
		{
						type: 'page',
						pattern: /^\/project\/brainly-scraper-ts\/?$/,
						params: empty,
						parts: [{ id: "src/pages/project/brainly-scraper-ts/index.svx", load: components[2] }],
						css: ["assets/start-c7eab101.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/project/brainly-scraper-ts/index.svx-379e1206.js", "chunks/project-2a6fdc5b.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Chrome-049b1c35.js"]
					},
		{
						type: 'page',
						pattern: /^\/project\/old-personal-site\/?$/,
						params: empty,
						parts: [{ id: "src/pages/project/old-personal-site/index.svx", load: components[3] }],
						css: ["assets/start-c7eab101.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/project/old-personal-site/index.svx-25833b6f.js", "chunks/project-2a6fdc5b.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Chrome-049b1c35.js"]
					},
		{
						type: 'page',
						pattern: /^\/project\/nyaa-si-scraper\/?$/,
						params: empty,
						parts: [{ id: "src/pages/project/nyaa-si-scraper/index.svx", load: components[4] }],
						css: ["assets/start-c7eab101.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/project/nyaa-si-scraper/index.svx-37ac17f7.js", "chunks/project-2a6fdc5b.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Chrome-049b1c35.js"]
					},
		{
						type: 'page',
						pattern: /^\/project\/covid-info-v2\/?$/,
						params: empty,
						parts: [{ id: "src/pages/project/covid-info-v2/index.svx", load: components[5] }],
						css: ["assets/start-c7eab101.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/project/covid-info-v2/index.svx-5b81c8a9.js", "chunks/project-2a6fdc5b.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Chrome-049b1c35.js"]
					},
		{
						type: 'page',
						pattern: /^\/project\/svelteception\/?$/,
						params: empty,
						parts: [{ id: "src/pages/project/svelteception/index.svx", load: components[6] }],
						css: ["assets/start-c7eab101.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/project/svelteception/index.svx-fae9431d.js", "chunks/project-2a6fdc5b.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Chrome-049b1c35.js"]
					},
		{
						type: 'page',
						pattern: /^\/project\/school-stuff\/?$/,
						params: empty,
						parts: [{ id: "src/pages/project/school-stuff/index.svx", load: components[7] }],
						css: ["assets/start-c7eab101.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/project/school-stuff/index.svx-78121e54.js", "chunks/project-2a6fdc5b.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Chrome-049b1c35.js"]
					},
		{
						type: 'page',
						pattern: /^\/project\/covid-info\/?$/,
						params: empty,
						parts: [{ id: "src/pages/project/covid-info/index.svx", load: components[8] }],
						css: ["assets/start-c7eab101.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/project/covid-info/index.svx-2d0e36ba.js", "chunks/project-2a6fdc5b.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Chrome-049b1c35.js", "chunks/Update-a504eac1.js"]
					},
		{
						type: 'page',
						pattern: /^\/project\/kana-board\/?$/,
						params: empty,
						parts: [{ id: "src/pages/project/kana-board/index.svx", load: components[9] }],
						css: ["assets/start-c7eab101.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/project/kana-board/index.svx-df51f977.js", "chunks/project-2a6fdc5b.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Chrome-049b1c35.js"]
					},
		{
						type: 'page',
						pattern: /^\/project\/umaru-chat\/?$/,
						params: empty,
						parts: [{ id: "src/pages/project/umaru-chat/index.svx", load: components[10] }],
						css: ["assets/start-c7eab101.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/project/umaru-chat/index.svx-2bd54fd5.js", "chunks/project-2a6fdc5b.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Chrome-049b1c35.js"]
					},
		{
						type: 'page',
						pattern: /^\/project\/kanaizu\/?$/,
						params: empty,
						parts: [{ id: "src/pages/project/kanaizu/index.svx", load: components[11] }],
						css: ["assets/start-c7eab101.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/project/kanaizu/index.svx-d340a902.js", "chunks/project-2a6fdc5b.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Chrome-049b1c35.js"]
					},
		{
						type: 'page',
						pattern: /^\/project\/gh-job\/?$/,
						params: empty,
						parts: [{ id: "src/pages/project/gh-job/index.svx", load: components[12] }],
						css: ["assets/start-c7eab101.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/project/gh-job/index.svx-eadc761a.js", "chunks/project-2a6fdc5b.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Chrome-049b1c35.js"]
					},
		{
						type: 'page',
						pattern: /^\/project\/skaga\/?$/,
						params: empty,
						parts: [{ id: "src/pages/project/skaga/index.svx", load: components[13] }],
						css: ["assets/start-c7eab101.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/project/skaga/index.svx-dffa0aae.js", "chunks/project-2a6fdc5b.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Chrome-049b1c35.js"]
					},
		{
						type: 'endpoint',
						pattern: /^\/rss\.xml$/,
						params: empty,
						load: () => import("../../src/pages/rss.xml.ts")
					},
		{
						type: 'page',
						pattern: /^\/about\/?$/,
						params: empty,
						parts: [{ id: "src/pages/about.svelte", load: components[14] }],
						css: ["assets/start-c7eab101.css", "assets/pages/about.svelte-04db3cbf.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/about.svelte-9ed5f4f9.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/index.svelte", load: components[15] }],
						css: ["assets/start-c7eab101.css", "assets/pages/post/index.svelte-ac1110d4.css", "assets/ProgressButton-42b56f44.css", "assets/PostCard-011f2f01.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/index.svelte-684f485b.js", "chunks/ProgressButton-a8599f0a.js", "chunks/PostCard-7862f637.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/prettify-screenshot-using-imagemagick\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/prettify-screenshot-using-imagemagick/index.svx", load: components[16] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/prettify-screenshot-using-imagemagick/index.svx-d31bb46b.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/comments-widget-using-utterance\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/comments-widget-using-utterance/index.svx", load: components[17] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/comments-widget-using-utterance/index.svx-48a5890b.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/i-rebuild-my-site-using-sapper\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/i-rebuild-my-site-using-sapper/index.svx", load: components[18] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/i-rebuild-my-site-using-sapper/index.svx-e6e9371d.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Update-a504eac1.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/japanese-input-method-on-linux\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/japanese-input-method-on-linux/index.svx", load: components[19] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/japanese-input-method-on-linux/index.svx-f6d29c3e.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Update-a504eac1.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/my-experience-with-svelte\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/my-experience-with-svelte/index.svx", load: components[20] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/my-experience-with-svelte/index.svx-6b764291.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Update-a504eac1.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/how-i-remember-heijitsu\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/how-i-remember-heijitsu/index.svx", load: components[21] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/how-i-remember-heijitsu/index.svx-abac7025.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/neovim-lua-statusline\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/neovim-lua-statusline/index.svx", load: components[22] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/neovim-lua-statusline/index.svx-99cd78d9.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Update-a504eac1.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/chrome-custom-newtab\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/chrome-custom-newtab/index.svx", load: components[23] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/chrome-custom-newtab/index.svx-927ccd1c.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Update-a504eac1.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/my-spotify-tui-setup\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/my-spotify-tui-setup/index.svx", load: components[24] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/my-spotify-tui-setup/index.svx-717de423.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/trying-out-sveltekit\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/trying-out-sveltekit/index.svx", load: components[25] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/trying-out-sveltekit/index.svx-4d9b22ef.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Update-a504eac1.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/making-of-my-site-2\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/making-of-my-site-2/index.svx", load: components[26] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/making-of-my-site-2/index.svx-e339d59b.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/making-of-my-site-3\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/making-of-my-site-3/index.svx", load: components[27] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/making-of-my-site-3/index.svx-16422baa.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/rest-client-for-vim\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/rest-client-for-vim/index.svx", load: components[28] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/rest-client-for-vim/index.svx-d364f75d.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/es6-array-methods\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/es6-array-methods/index.svx", load: components[29] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/es6-array-methods/index.svx-7bf55ca7.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/making-of-my-site\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/making-of-my-site/index.svx", load: components[30] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/making-of-my-site/index.svx-3d6dbb8b.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/my-nvim-lsp-setup\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/my-nvim-lsp-setup/index.svx", load: components[31] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/my-nvim-lsp-setup/index.svx-535357a5.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Update-a504eac1.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/my-suckless-setup\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/my-suckless-setup/index.svx", load: components[32] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/my-suckless-setup/index.svx-36ec29e2.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Update-a504eac1.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/why-i-use-linux\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/why-i-use-linux/index.svx", load: components[33] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/why-i-use-linux/index.svx-6048b121.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/github-actions\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/github-actions/index.svx", load: components[34] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/github-actions/index.svx-4eb55e82.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/vim-statusline\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/vim-statusline/index.svx", load: components[35] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/vim-statusline/index.svx-821f6cd8.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Update-a504eac1.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/site-redesign\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/site-redesign/index.svx", load: components[36] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/site-redesign/index.svx-a4e5eb3e.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js", "chunks/Update-a504eac1.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/thinkpad-x220\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/thinkpad-x220/index.svx", load: components[37] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/thinkpad-x220/index.svx-0c609490.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/defx-nvim\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/defx-nvim/index.svx", load: components[38] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/defx-nvim/index.svx-c9fd508e.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'page',
						pattern: /^\/post\/2bwm\/?$/,
						params: empty,
						parts: [{ id: "src/pages/post/2bwm/index.svx", load: components[39] }],
						css: ["assets/start-c7eab101.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
						js: ["start-f65e4750.js", "chunks/stores-7ca13020.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-0c5a7997.js", "pages/post/2bwm/index.svx-ffbfbf56.js", "chunks/post-df226dec.js", "chunks/ProgressButton-a8599f0a.js"]
					},
		{
						type: 'endpoint',
						pattern: /^\/api\/project\.json$/,
						params: empty,
						load: () => import("../../src/pages/api/project.json.ts")
					},
		{
						type: 'endpoint',
						pattern: /^\/api\/post\.json$/,
						params: empty,
						load: () => import("../../src/pages/api/post.json.ts")
					}
	]
};

export function render(request, {
	paths = {"base":"","assets":"/."},
	local = false,
	only_render_prerenderable_pages = false,
	get_static_file
} = {}) {
	return ssr(request, {
		paths,
		local,
		template,
		manifest,
		target: "#svelte",
		entry: "/./_app/start-f65e4750.js",
		root,
		setup,
		dev: false,
		amp: false,
		only_render_prerenderable_pages,
		app_dir: "_app",
		host: null,
		host_header: null,
		get_component_path: id => "/./_app/" + client_component_lookup[id],
		get_stack: error => error.stack,
		get_static_file,
		get_amp_css: dep => amp_css_lookup[dep]
	});
}