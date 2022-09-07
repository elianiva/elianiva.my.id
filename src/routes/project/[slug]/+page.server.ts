import { getResourcesAsync } from "$lib/utils/fetch-data";
import { error } from "@sveltejs/kit";
import { compile } from "mdsvex";
import MDSVEX_CONFIG from "../../../../mdsvex.config";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
	const resources = await getResourcesAsync("project");
	const post = resources.find((item) => item.slug === params.slug);

	if (post === undefined) throw error(404, "Not found");

	const compiledContent = await compile(post.content, MDSVEX_CONFIG);

	return {
		title: post.title,
		desc: post.desc,
		demo: post.demo,
		source: post.source,
		stack: post.stack,
		content: compiledContent.code,
		url: url.pathname,
	};
};
