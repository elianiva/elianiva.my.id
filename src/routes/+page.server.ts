import { getResourcesAsync } from "$lib/utils/fetch-data";

export const load = async ({ url }) => {
	let posts = await getResourcesAsync("post");
	let projects = await getResourcesAsync("project");

	return {
		posts: posts.slice(0, 3),
		projects: projects.filter((p) => p.type === "personal").slice(0, 3),
		url: url.pathname,
	};
};
