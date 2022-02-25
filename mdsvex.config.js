import { defineMDSveXConfig } from "mdsvex";
import rehypeSlug from "rehype-slug";
import rehypeAutolink from "rehype-autolink-headings";
import remarkTOC from "remark-toc";

export default defineMDSveXConfig({
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
  remarkPlugins: [remarkTOC],
  rehypePlugins: [rehypeSlug, [rehypeAutolink, { behavior: "wrap" }]],
});
