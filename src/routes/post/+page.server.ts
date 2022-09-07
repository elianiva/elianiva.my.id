import { getResourcesAsync } from "$lib/utils/fetch-data";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
	let posts = await getResourcesAsync("post");

	return {
		posts,
		url: url.pathname,
	};
};
