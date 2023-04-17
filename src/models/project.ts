import type { CollectionEntry } from "astro:content";

export type ProjectMeta = CollectionEntry<"projects">["data"];
export type Project = CollectionEntry<"projects">;
