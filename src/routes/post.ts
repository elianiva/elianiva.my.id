import { getResourcesAsync } from "$lib/utils/fetch-data";

export const get = async () => {
  const resources = await getResourcesAsync("post");

  return {
    body: {
      posts: resources,
    },
  };
};
