import remarkTOC from "remark-toc";
import rehypeSlug from "rehype-slug";
import rehypeAutolink from "rehype-autolink-headings";
import * as shiki from "shiki";

// fix whitespace weirdness
const escape = code => {
  return code
    .replace(/[{}`]/g, c => ({ "{": "&#123;", "}": "&#125;", "`": "&#96;" }[c]))
    .replace(/\\([trn])/g, "&#92;$1");
};

const highlighter = async (code, lang) => {
  const highlighter = await shiki.getHighlighter({ theme: "github-dark" });
  const highlightedCode = highlighter.codeToHtml(code, lang || "text");
  return `{@html \`${escape(highlightedCode)}\` }`;
};

export default {
  layout: {
    _: "./src/lib/layouts/post.svelte",
    project: "./src/lib/layouts/project.svelte",
    about: "./src/lib/layouts/about.svelte",
  },
  extensions: [".svx", ".md"],
  smartypants: {
    dashes: "oldschool",
  },
  remarkPlugins: [remarkTOC],
  rehypePlugins: [rehypeSlug, [rehypeAutolink, { behavior: "wrap" }]],
  // highlight: {
  //   highlighter,
  // },
};
