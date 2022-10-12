import type { APIRoute } from "astro";
import { getResourcesAsync } from "~/services/get-resources";
import type { ResourceKind } from "~/services/types/resource-kind";

export const get: APIRoute = async ({ params, request }) => {
	const url = new URL(request.url);
	const slug = url.searchParams.get("slug");
	const type = url.searchParams.get("type");
	const limit = parseInt(url.searchParams.get("limit") ?? "");

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

	if (items.length < 1) {
		return new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });
	}

	return new Response(JSON.stringify(items), { status: 200 });
};
