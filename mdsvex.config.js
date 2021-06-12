import remarkTOC from "remark-toc";
import rehypeSlug from "rehype-slug";
import rehypeAutolink from "rehype-autolink-headings";

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
};
