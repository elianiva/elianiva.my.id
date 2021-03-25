const { mdsvex } = require("mdsvex");
const mdsvexConfig = require("./mdsvex.config.cjs");
const sveltePreprocess = require("svelte-preprocess");
const adapterVercel = require("@sveltejs/adapter-vercel");
const pkg = require("./package.json");
const path = require("path");

/** @type {import('@sveltejs/kit').Config} */
module.exports = {
  extensions: [".svelte", ...mdsvexConfig.extensions],
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    mdsvex(mdsvexConfig),
    sveltePreprocess(),
  ],
  kit: {
    // By default, `npm run build` will create a standard Node app.
    // You can create optimized builds for different platforms by
    // specifying a different adapter
    adapter: adapterVercel(),

    // hydrate the <div id="svelte"> element in src/app.html
    target: "#svelte",

    files: {
      routes: "./src/pages",
    },

    vite: {
      ssr: {
        noExternal: Object.keys(pkg.dependencies || {}),
      },
      resolve: {
        alias: [
          { find: "#/", replacement: path.join(__dirname, "./src") },
        ],
      },
    },
  },
};
