import resolve from "@rollup/plugin-node-resolve"
import replace from "@rollup/plugin-replace"
import commonjs from "@rollup/plugin-commonjs"
import svelte from "rollup-plugin-svelte"
import babel from "@rollup/plugin-babel"
import { terser } from "rollup-plugin-terser"
import { mdsvex } from "mdsvex"
import config from "sapper/config/rollup.js"
import pkg from "./package.json"
import svelteSVG from "rollup-plugin-svelte-svg"
import svelteImage from "svelte-image"
import posts from "./src/utils/fetch-all-posts"

const mode = process.env.NODE_ENV
const dev = mode === "development"
const legacy = !!process.env.SAPPER_LEGACY_BUILD

const onwarn = (warning, onwarn) =>
  (warning.code === "MISSING_EXPORT" && /'preload'/.test(warning.message)) ||
  (warning.code === "CIRCULAR_DEPENDENCY" &&
    /[/\\]@sapper[/\\]/.test(warning.message)) ||
  onwarn(warning)

const sveltePreprocess = require("svelte-preprocess")({
  postcss: {
    plugins: [
      require("autoprefixer")({ overrideBrowserslist: "last 2 versions" }),
    ],
  },
})

const svelteOptions = {
  dev,
  hydratable: true,
  extensions: [".svelte", ".svx"],
  preprocess: [
    sveltePreprocess,
    mdsvex(),
    svelteImage({ placeholder: "blur" }),
  ],
}

export default {
  client: {
    input: config.client.input(),
    output: config.client.output(),
    plugins: [
      replace({
        "process.browser": true,
        "process.env.NODE_ENV": JSON.stringify(mode),
        __POSTS__: JSON.stringify(posts),
      }),
      svelte({
        emitCss: true,
        ...svelteOptions,
      }),
      resolve({
        browser: true,
        dedupe: ["svelte"],
      }),
      commonjs(),
      svelteSVG({ dev }),

      legacy &&
        babel({
          extensions: [".js", ".mjs", ".html", ".svelte"],
          babelHelpers: "runtime",
          exclude: ["node_modules/@babel/**"],
          presets: [
            [
              "@babel/preset-env",
              {
                targets: "> 0.25%, not dead",
              },
            ],
          ],
          plugins: [
            "@babel/plugin-syntax-dynamic-import",
            [
              "@babel/plugin-transform-runtime",
              {
                useESModules: true,
              },
            ],
          ],
        }),

      !dev &&
        terser({
          module: true,
        }),
    ],

    preserveEntrySignatures: false,
    onwarn,
  },

  server: {
    input: config.server.input(),
    output: config.server.output(),
    plugins: [
      replace({
        "process.browser": false,
        "process.env.NODE_ENV": JSON.stringify(mode),
        __POSTS__: JSON.stringify(posts),
      }),
      svelte({
        generate: "ssr",
        ...svelteOptions,
      }),
      resolve({
        dedupe: ["svelte"],
      }),
      commonjs(),
      svelteSVG({ generate: "ssr", dev }),
    ],
    external: Object.keys(pkg.dependencies).concat(
      require("module").builtinModules
    ),

    preserveEntrySignatures: "strict",
    onwarn,
  },

  serviceworker: {
    input: config.serviceworker.input(),
    output: config.serviceworker.output(),
    plugins: [
      resolve(),
      replace({
        "process.browser": true,
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
      commonjs(),
      !dev && terser(),
    ],

    preserveEntrySignatures: false,
    onwarn,
  },
}
