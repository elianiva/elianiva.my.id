import type { ResourceMetadata } from "$lib/utils/fetch-data";

export const getHandler = (getItemsAsync: () => Promise<ResourceMetadata[]>) => {
  return async ({ query: q }) => {
    let items = await getItemsAsync();

    const limit = parseInt(q.get("limit"));
    const title = q.get("title");
    const type = q.get("type");

    if (type) items = items.filter(item => item.type === type);
    if (title) items = items.filter(item => item.title === title);
    if (limit) items = items.slice(0, limit);

    if (items) {
      return {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: items,
      };
    }

    return {
      status: 404,
      body: "Not Found",
    };
  };
};
