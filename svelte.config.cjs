const { mdsvex } = require("mdsvex");
const mdsvexConfig = require("./mdsvex.config.cjs");
const sveltePreprocess = require("svelte-preprocess");
const adapterStatic = require("@sveltejs/adapter-static");
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
    adapter: adapterStatic(),

    // hydrate the <div id="svelte"> element in src/app.html
    target: "#svelte",

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
