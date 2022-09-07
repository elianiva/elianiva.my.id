import { getResourcesAsync } from "$lib/utils/fetch-data";
import { error } from "@sveltejs/kit";
import { compile } from "mdsvex";
import MDSVEX_CONFIG from "../../../../mdsvex.config";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
	const resources = await getResourcesAsync("post");
	const slug = params.slug;
	const post = resources.find((item) => item.slug === slug);

	if (post === undefined) throw error(404, "Not found");

	const compiledContent = await compile(post.content, MDSVEX_CONFIG);

	return {
		title: post.title,
		date: post.date,
		desc: post.desc,
		tags: post.tags,
		minimal: post.minimal,
		content: compiledContent.code,
		headings: post.headings,
		url: url.pathname,
	};
};
