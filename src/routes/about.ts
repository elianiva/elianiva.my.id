import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url }) => {
	return {
		body: {
			url: url.pathname,
		},
	};
};
