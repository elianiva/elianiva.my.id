import { getResourcesAsync } from "$lib/utils/fetch-data";

export const GET = async () => {
  const resources = await getResourcesAsync("post");

  return {
    body: {
      posts: resources,
    },
  };
};
