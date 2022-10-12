import matter from "gray-matter";
import { POSTS, PROJECTS } from "./constants";
import type { ResourceKind } from "./types/resource-kind";
import type { ResourceMetadata } from "./types/resource-metadata";

export async function getResourcesAsync(kind: ResourceKind): Promise<ResourceMetadata[]> {
	if (!kind) throw new Error("KIND IS REQUIRED!");

	const validFiles = kind === "post" ? POSTS : PROJECTS;
	const fileMetadata = Object.keys(validFiles).map(async (fileName): Promise<ResourceMetadata> => {
		const postContent = validFiles[fileName] as unknown as string;
		const { data } = matter(postContent);
		const slug = fileName.replace(new RegExp(`/data/${kind}/(.*)/index.svx`), "$1");
		// extract headings for table of contents, might replace it soon
		const headings = postContent
			.split("\n")
			.filter((line) => {
				const startsWithHash = line.startsWith("#");
				if (!startsWithHash) return false;

				const [, headingText = ""] = line.split(" ");
				const startsWithCapitalLetter = /^[A-Z]/.test(headingText);
				if (startsWithCapitalLetter) return true;

				return false;
			})
			.map((line) => {
				const headingPoundSymbols = line.match(/^#{1,5}/)?.[0] ?? "";
				const level = headingPoundSymbols.length;
				const value = line.replace(/^#{1,5}\s/, "");
				return { level, value };
			});

		return {
			...(data as ResourceMetadata),
			slug,
			headings,
			content: postContent,
		};
	});

	const result = await Promise.all(fileMetadata);

	return result
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.filter((post) => (kind === "post" ? !post.draft : true));
}
