import MDSVEX_CONFIG from "../../../mdsvex.config";
import { getResourcesAsync } from "$lib/utils/fetch-data";
import { compile } from "mdsvex";

export const get = async ({ params }) => {
  const resources = await getResourcesAsync("project");
  const slug = params.slug;
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
      desc: post.desc,
      demo: post.demo,
      source: post.source,
      stack: post.stack,
      content: compiledContent.code,
    },
  };
};
