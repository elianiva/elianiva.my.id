import { defineCollection, z } from "astro:content";
import { githubLoader } from "./loaders/github.ts";
import { notesLoader } from "./loaders/notes.ts";

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

const githubCollection = defineCollection({
	loader: githubLoader({
		username: "elianiva",
		minStars: 5000,
	}),
});

const notesCollection = defineCollection({
	loader: notesLoader(),
});

export const collections = {
	projects: projectCollection,
	posts: postCollection,
	notes: notesCollection,
	github: githubCollection,
};
