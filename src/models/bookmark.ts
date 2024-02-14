import type { CollectionEntry } from "astro:content";

export type BookmarkMeta = CollectionEntry<"bookmarks">["data"];
export type Bookmark = CollectionEntry<"bookmarks">;
