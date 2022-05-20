import MDSVEX_CONFIG from "../../../mdsvex.config";
import { getResourcesAsync } from "$lib/utils/fetch-data";
import { compile } from "mdsvex";

export const get = async ({ params }) => {
  const resources = await getResourcesAsync("post");
  const slug = params.slug;
  // const slug = "japanese-fts-using-sqlite";
  const post = resources.find((item) => item.slug === slug);

  if (post === undefined) {
    return {
      status: 404,
    };
  }

  const compiledContent = await compile(post.content, MDSVEX_CONFIG);

  return {
    body: {
      title: post.title,
      date: post.date,
      desc: post.desc,
      tags: post.tags,
      minimal: post.minimal,
      content: compiledContent.code,
      headings: post.headings,
    },
  };
};
