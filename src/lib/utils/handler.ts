import type { ResultAttr } from "$lib/utils/fetch-data";

export const getHandler = (getItemsAsync: () => Promise<ResultAttr[]>) => {
  return async ({ query: q }) => {
    let items = await getItemsAsync();

    const limit = parseInt(q.get("limit"));
    const title = q.get("title");

    if (limit) items = items.slice(0, limit);
    if (title) items = items.filter(item => item.title === title);

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
