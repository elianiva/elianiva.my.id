import { getResourcesAsync } from "$lib/utils/fetch-data";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
	const resources = await getResourcesAsync("project");

	return {
		projects: resources,
		url: url.pathname,
	};
};
