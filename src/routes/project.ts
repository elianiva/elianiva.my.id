import { getResourcesAsync } from "$lib/utils/fetch-data";

export const GET = async () => {
	const resources = await getResourcesAsync("project");

	return {
		body: {
			projects: resources,
		},
	};
};
