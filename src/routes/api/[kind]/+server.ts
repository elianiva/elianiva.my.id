import { getResourcesAsync, type ResourceKind } from "$lib/utils/fetch-data";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const prerender = true;

export const GET: RequestHandler = async ({ params, url }) => {
	const slug = url.searchParams.get("slug");
	const type = url.searchParams.get("type");
	const limit = parseInt(url.searchParams.get("limit"));

	let items = await getResourcesAsync(params.kind as ResourceKind);

	if (type !== null && type !== "") {
		items = items.filter((item) => item.type === type);
	}

	if (slug !== null && slug !== "") {
		items = items.filter((item) => item.slug === slug);
	}

	if (limit !== null && !isNaN(limit)) {
		items = items.slice(0, limit);
	}

	if (items.length < 1) throw error(404, "Not found");

	return new Response(JSON.stringify(items), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
	});
};
