import type { RequestHandler } from "@sveltejs/kit";
import { getResourcesAsync } from "$lib/utils/fetch-data";
import { compile } from "mdsvex";
import MDSVEX_CONFIG from "../../../mdsvex.config";

export const GET: RequestHandler = async ({ params }) => {
	const resources = await getResourcesAsync("project");
	const slug = params.slug;
	const post = resources.find((item) => item.slug === slug);

	if (post === undefined) {
		return {
			status: 404,
		};
	}

	const compiledContent = await compile(post.content, MDSVEX_CONFIG);

	return {
		body: {
			title: post.title,
			desc: post.desc,
			demo: post.demo,
			source: post.source,
			stack: post.stack,
			content: compiledContent.code,
		},
	};
};
