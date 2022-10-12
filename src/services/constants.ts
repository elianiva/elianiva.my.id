export const POSTS = import.meta.glob("/data/post/**/index.svx", {
	as: "raw",
	eager: true,
});
export const PROJECTS = import.meta.glob("/data/project/**/index.svx", {
	as: "raw",
	eager: true,
});
