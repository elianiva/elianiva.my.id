export const POSTS = import.meta.glob("/data/posts/**/index.svx", {
	as: "raw",
	eager: true,
});
export const PROJECTS = import.meta.glob("/data/projects/**/index.svx", {
	as: "raw",
	eager: true,
});
