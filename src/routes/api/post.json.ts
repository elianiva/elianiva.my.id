import { getResources } from "$lib/utils/fetch-data";
import type { RequestHandler } from "@sveltejs/kit";

export const get: RequestHandler = async ({ query: q }) => {
  let result = getResources("post").filter(item => !item.draft);

  const limit = parseInt(q.get("limit"));
  const title = q.get("title");

  if (limit) result = result.slice(0, limit);
  if (title) result = result.filter(item => item.title === title);

  if (result) {
    return {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: result,
    };
  }

  return {
    status: 404,
    body: "Not Found",
  };
};
