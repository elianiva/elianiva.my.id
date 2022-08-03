import { getResourcesAsync } from "$lib/utils/fetch-data";
import type { RequestHandler } from "@sveltejs/kit";
import type { JSONObject } from "@sveltejs/kit/types/private";

export const GET: RequestHandler = async () => {
  let posts = await getResourcesAsync("post");
  let projects = await getResourcesAsync("project");

  return {
    body: {
      posts: posts.slice(0, 3) as unknown as JSONObject[],
      projects: projects
        .filter((p) => p.type === "personal")
        .slice(0, 3) as unknown as JSONObject[],
    },
  };
};
