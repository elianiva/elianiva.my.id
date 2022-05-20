import { defineMDSveXConfig, escapeSvelte } from "mdsvex";
import rehypeSlug from "rehype-slug";
import rehypeAutolink from "rehype-autolink-headings";
import { getHighlighter } from "shiki";

const highlighter = await getHighlighter({ theme: "github-dark" });

export const MDSVEX_CONFIG = defineMDSveXConfig({
  layout: {
    _: "./src/lib/layouts/post.svelte",
    post: "./src/lib/layouts/post.svelte",
    project: "./src/lib/layouts/project.svelte",
    about: "./src/lib/layouts/about.svelte",
  },
  extensions: [".svx", ".md"],
  smartypants: {
    dashes: "oldschool",
  },
  rehypePlugins: [rehypeSlug, [rehypeAutolink, { behavior: "wrap" }]],
  highlight: {
    highlighter: async (code, lang = "text") => {
      const highlightedCode = escapeSvelte(
        highlighter.codeToHtml(code, { lang })
      );
      return highlightedCode;
    },
  },
});
