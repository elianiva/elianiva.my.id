import { getResourcesAsync } from "$lib/utils/fetch-data";
import { getHandler } from "$lib/utils/handler";
import type { RequestHandler } from "@sveltejs/kit";

export const get = getHandler(() =>
  getResourcesAsync("post")
) as RequestHandler;
