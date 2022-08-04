import { getResourcesAsync } from "$lib/utils/fetch-data";

export const GET = async ({ url }) => {
	const resources = await getResourcesAsync("post");

	return {
		body: {
			posts: resources,
			url: url.pathname,
		},
	};
};
