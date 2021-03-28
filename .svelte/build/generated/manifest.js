import * as layout from "../../../src/pages/$layout.svelte";

const components = [
	() => import("../../../src/pages/index.svelte"),
	() => import("../../../src/pages/project/index.svelte"),
	() => import("../../../src/pages/project/brainly-scraper-ts/index.svx"),
	() => import("../../../src/pages/project/old-personal-site/index.svx"),
	() => import("../../../src/pages/project/nyaa-si-scraper/index.svx"),
	() => import("../../../src/pages/project/covid-info-v2/index.svx"),
	() => import("../../../src/pages/project/svelteception/index.svx"),
	() => import("../../../src/pages/project/school-stuff/index.svx"),
	() => import("../../../src/pages/project/covid-info/index.svx"),
	() => import("../../../src/pages/project/kana-board/index.svx"),
	() => import("../../../src/pages/project/umaru-chat/index.svx"),
	() => import("../../../src/pages/project/kanaizu/index.svx"),
	() => import("../../../src/pages/project/gh-job/index.svx"),
	() => import("../../../src/pages/project/skaga/index.svx"),
	() => import("../../../src/pages/about.svelte"),
	() => import("../../../src/pages/post/index.svelte"),
	() => import("../../../src/pages/post/prettify-screenshot-using-imagemagick/index.svx"),
	() => import("../../../src/pages/post/comments-widget-using-utterance/index.svx"),
	() => import("../../../src/pages/post/i-rebuild-my-site-using-sapper/index.svx"),
	() => import("../../../src/pages/post/japanese-input-method-on-linux/index.svx"),
	() => import("../../../src/pages/post/my-experience-with-svelte/index.svx"),
	() => import("../../../src/pages/post/how-i-remember-heijitsu/index.svx"),
	() => import("../../../src/pages/post/neovim-lua-statusline/index.svx"),
	() => import("../../../src/pages/post/chrome-custom-newtab/index.svx"),
	() => import("../../../src/pages/post/my-spotify-tui-setup/index.svx"),
	() => import("../../../src/pages/post/trying-out-sveltekit/index.svx"),
	() => import("../../../src/pages/post/making-of-my-site-2/index.svx"),
	() => import("../../../src/pages/post/making-of-my-site-3/index.svx"),
	() => import("../../../src/pages/post/rest-client-for-vim/index.svx"),
	() => import("../../../src/pages/post/es6-array-methods/index.svx"),
	() => import("../../../src/pages/post/making-of-my-site/index.svx"),
	() => import("../../../src/pages/post/my-nvim-lsp-setup/index.svx"),
	() => import("../../../src/pages/post/my-suckless-setup/index.svx"),
	() => import("../../../src/pages/post/why-i-use-linux/index.svx"),
	() => import("../../../src/pages/post/github-actions/index.svx"),
	() => import("../../../src/pages/post/vim-statusline/index.svx"),
	() => import("../../../src/pages/post/site-redesign/index.svx"),
	() => import("../../../src/pages/post/thinkpad-x220/index.svx"),
	() => import("../../../src/pages/post/defx-nvim/index.svx"),
	() => import("../../../src/pages/post/2bwm/index.svx")
];

const d = decodeURIComponent;
const empty = () => ({});

export const routes = [
	// src/pages/index.svelte
[/^\/$/, [components[0]]],

// src/pages/project/index.svelte
[/^\/project\/?$/, [components[1]]],

// src/pages/project/brainly-scraper-ts/index.svx
[/^\/project\/brainly-scraper-ts\/?$/, [components[2]]],

// src/pages/project/old-personal-site/index.svx
[/^\/project\/old-personal-site\/?$/, [components[3]]],

// src/pages/project/nyaa-si-scraper/index.svx
[/^\/project\/nyaa-si-scraper\/?$/, [components[4]]],

// src/pages/project/covid-info-v2/index.svx
[/^\/project\/covid-info-v2\/?$/, [components[5]]],

// src/pages/project/svelteception/index.svx
[/^\/project\/svelteception\/?$/, [components[6]]],

// src/pages/project/school-stuff/index.svx
[/^\/project\/school-stuff\/?$/, [components[7]]],

// src/pages/project/covid-info/index.svx
[/^\/project\/covid-info\/?$/, [components[8]]],

// src/pages/project/kana-board/index.svx
[/^\/project\/kana-board\/?$/, [components[9]]],

// src/pages/project/umaru-chat/index.svx
[/^\/project\/umaru-chat\/?$/, [components[10]]],

// src/pages/project/kanaizu/index.svx
[/^\/project\/kanaizu\/?$/, [components[11]]],

// src/pages/project/gh-job/index.svx
[/^\/project\/gh-job\/?$/, [components[12]]],

// src/pages/project/skaga/index.svx
[/^\/project\/skaga\/?$/, [components[13]]],

// src/pages/rss.xml.ts
[/^\/rss\.xml$/],

// src/pages/about.svelte
[/^\/about\/?$/, [components[14]]],

// src/pages/post/index.svelte
[/^\/post\/?$/, [components[15]]],

// src/pages/post/prettify-screenshot-using-imagemagick/index.svx
[/^\/post\/prettify-screenshot-using-imagemagick\/?$/, [components[16]]],

// src/pages/post/comments-widget-using-utterance/index.svx
[/^\/post\/comments-widget-using-utterance\/?$/, [components[17]]],

// src/pages/post/i-rebuild-my-site-using-sapper/index.svx
[/^\/post\/i-rebuild-my-site-using-sapper\/?$/, [components[18]]],

// src/pages/post/japanese-input-method-on-linux/index.svx
[/^\/post\/japanese-input-method-on-linux\/?$/, [components[19]]],

// src/pages/post/my-experience-with-svelte/index.svx
[/^\/post\/my-experience-with-svelte\/?$/, [components[20]]],

// src/pages/post/how-i-remember-heijitsu/index.svx
[/^\/post\/how-i-remember-heijitsu\/?$/, [components[21]]],

// src/pages/post/neovim-lua-statusline/index.svx
[/^\/post\/neovim-lua-statusline\/?$/, [components[22]]],

// src/pages/post/chrome-custom-newtab/index.svx
[/^\/post\/chrome-custom-newtab\/?$/, [components[23]]],

// src/pages/post/my-spotify-tui-setup/index.svx
[/^\/post\/my-spotify-tui-setup\/?$/, [components[24]]],

// src/pages/post/trying-out-sveltekit/index.svx
[/^\/post\/trying-out-sveltekit\/?$/, [components[25]]],

// src/pages/post/making-of-my-site-2/index.svx
[/^\/post\/making-of-my-site-2\/?$/, [components[26]]],

// src/pages/post/making-of-my-site-3/index.svx
[/^\/post\/making-of-my-site-3\/?$/, [components[27]]],

// src/pages/post/rest-client-for-vim/index.svx
[/^\/post\/rest-client-for-vim\/?$/, [components[28]]],

// src/pages/post/es6-array-methods/index.svx
[/^\/post\/es6-array-methods\/?$/, [components[29]]],

// src/pages/post/making-of-my-site/index.svx
[/^\/post\/making-of-my-site\/?$/, [components[30]]],

// src/pages/post/my-nvim-lsp-setup/index.svx
[/^\/post\/my-nvim-lsp-setup\/?$/, [components[31]]],

// src/pages/post/my-suckless-setup/index.svx
[/^\/post\/my-suckless-setup\/?$/, [components[32]]],

// src/pages/post/why-i-use-linux/index.svx
[/^\/post\/why-i-use-linux\/?$/, [components[33]]],

// src/pages/post/github-actions/index.svx
[/^\/post\/github-actions\/?$/, [components[34]]],

// src/pages/post/vim-statusline/index.svx
[/^\/post\/vim-statusline\/?$/, [components[35]]],

// src/pages/post/site-redesign/index.svx
[/^\/post\/site-redesign\/?$/, [components[36]]],

// src/pages/post/thinkpad-x220/index.svx
[/^\/post\/thinkpad-x220\/?$/, [components[37]]],

// src/pages/post/defx-nvim/index.svx
[/^\/post\/defx-nvim\/?$/, [components[38]]],

// src/pages/post/2bwm/index.svx
[/^\/post\/2bwm\/?$/, [components[39]]],

// src/pages/api/project.json.ts
[/^\/api\/project\.json$/],

// src/pages/api/post.json.ts
[/^\/api\/post\.json$/]
];

export { layout };