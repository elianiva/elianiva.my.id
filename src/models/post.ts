import type { CollectionEntry } from "astro:content";

export type PostMeta = CollectionEntry<"posts">["data"];
export type Post = CollectionEntry<"posts">;
