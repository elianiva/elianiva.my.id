import { defineCollection, z } from "astro:content";
import { githubLoader } from "./loaders/github.ts";

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
		hasImage: z.boolean().default(true),
		date: z.coerce.date(),
		description: z.string(),
		demo: z.string().nullable().default(null),
		source: z.string(),
		type: z.enum(["personal", "assignment", "open-source"]),
		stack: z.array(z.tuple([z.string(), z.string()])),
		featured: z.boolean().default(false),
	}),
});

const bookmarkCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		links: z
			.array(
				z.object({
					title: z.string().nullable().default(null),
					url: z.string(),
				}),
			)
			.nullable()
			.default(null),
		date: z.coerce.date(),
		type: z.enum(["til", "bookmark"]).default("bookmark"),
	}),
});

const githubCollection = defineCollection({
	loader: githubLoader({
		username: "elianiva",
		minStars: 5000,
	}),
});

export const collections = {
	projects: projectCollection,
	posts: postCollection,
	bookmarks: bookmarkCollection,
	github: githubCollection,
};
