import { getResourcesAsync, ResourceKind } from "$lib/utils/fetch-data";
import type { RequestEvent } from "@sveltejs/kit";

export async function get({
  params,
  url: { searchParams: q },
}: RequestEvent<{ kind: ResourceKind }>) {
  const limit = parseInt(q.get("limit"));
  const title = q.get("title");
  const type = q.get("type");

  let items = await getResourcesAsync(params.kind);

  if (type) items = items.filter((item) => item.type === type);
  if (title) items = items.filter((item) => item.title === title);
  if (limit) items = items.slice(0, limit);

  if (items.length > 1) {
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
    body: [],
  };
}
