import { getResourcesAsync } from "$lib/utils/fetch-data";

export async function get({ params, url: { searchParams: q } }) {
	const slug = q.get("slug");
	const type = q.get("type");
	const limit = parseInt(q.get("limit"));

	let items = await getResourcesAsync(params.kind);

	if (type !== null && type !== "") {
		items = items.filter((item) => item.type === type);
	}

	if (slug !== null && slug !== "") {
		items = items.filter((item) => item.slug === slug);
	}

	if (limit !== null && !isNaN(limit)) {
		items = items.slice(0, limit);
	}

	if (items.length >= 1) {
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
