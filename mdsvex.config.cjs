module.exports = {
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
