import type { RequestHandler } from "@sveltejs/kit";
import { getResourcesAsync } from "$lib/utils/fetch-data";
import { compile } from "mdsvex";
import MDSVEX_CONFIG from "../../../mdsvex.config";
import type { JSONObject } from "@sveltejs/kit/types/private";

export const GET: RequestHandler = async ({ params, url }) => {
	const resources = await getResourcesAsync("post");
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
			date: post.date,
			desc: post.desc,
			tags: post.tags,
			minimal: post.minimal,
			content: compiledContent.code,
			headings: post.headings as unknown as JSONObject[],
			url: url.pathname,
		},
	};
};
