import { defineMDSveXConfig, escapeSvelte } from "mdsvex";
import rehypeSlug from "rehype-slug";
import rehypeAutolink from "rehype-autolink-headings";
import { getHighlighter } from "shiki";

const highlighter = await getHighlighter({ theme: "github-dark" });

export default defineMDSveXConfig({
  layout: {
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
