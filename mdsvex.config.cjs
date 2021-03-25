module.exports = {
  layout: {
    _: "./src/lib/layouts/post.svelte",
    project: "./src/lib/layouts/project.svelte",
  },
  extensions: [".svx", ".md"],
  smartypants: {
    dashes: "oldschool",
  },
  remarkPlugins: [
    require("remark-toc"),
  ],
  rehypePlugins: [
    require("rehype-slug"),
    [require("rehype-autolink-headings"), {
      behavior: "wrap",
    }],
  ],
};
