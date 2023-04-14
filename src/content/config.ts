import { defineCollection, z } from "astro:content";

const postCollection = defineCollection({
	schema: z.object({
		draft: z.boolean().optional().default(false),
		title: z.string(),
		date: z.coerce.date(),
		description: z.string(),
		tags: z.array(z.string()),
	}),
});

const projectCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		description: z.string(),
		demo: z.string().nullable().default(null),
		source: z.string(),
		type: z.enum(["personal", "assignment"]),
		stack: z.array(z.tuple([z.string(), z.string()])),
	}),
});

export const collections = {
	projects: projectCollection,
	posts: postCollection,
};
