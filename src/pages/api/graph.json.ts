import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
	const notes = await getCollection("notes");

	const nodes = notes.map((note) => ({
		id: note.id,
		title: note.data.title,
		category: note.data.category,
		val: Math.max(4, note.data.backlinks.length + 2),
	}));

	const links = notes.flatMap((note) =>
		note.data.outgoing_links
			.filter((targetId) => notes.some((n) => n.id === targetId))
			.map((targetId) => ({
				source: note.id,
				target: targetId,
			})),
	);

	return new Response(JSON.stringify({ nodes, links }), {
		headers: {
			"Content-Type": "application/json",
		},
	});
};
