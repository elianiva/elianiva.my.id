import { getResourcesAsync } from "$lib/utils/fetch-data";

export const GET = async ({ url }) => {
	const resources = await getResourcesAsync("project");

	return {
		body: {
			projects: resources,
			url: url.pathname,
		},
	};
};
