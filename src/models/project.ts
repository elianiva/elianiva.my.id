import type { MDXInstance } from "astro";
import { ResourceBase } from "./resource";

export class Project extends ResourceBase {
	public readonly demo: string | null;
	public readonly source: string;
	public readonly type: string;
	public readonly stack: [string, string][];

	public constructor(data: MDXInstance<Record<string, any>>) {
		super(data);

		if (!("demo" in data.frontmatter) || data.frontmatter.demo?.length === 0) {
			throw new Error("demo is required");
		}

		if (!("source" in data.frontmatter) || data.frontmatter.source?.length === 0) {
			throw new Error("source is required");
		}

		if (!("type" in data.frontmatter) || data.frontmatter.type?.length === 0) {
			throw new Error("type is required");
		}

		if (
			!("stack" in data.frontmatter) ||
			!Array.isArray(data.frontmatter?.stack) ||
			data.frontmatter?.stack?.[0].length !== 2
		) {
			throw new Error(`stack must be an array of [string, string], ${typeof data.frontmatter.stack} was passed`);
		}

		this.demo = data.frontmatter.demo;
		this.source = data.frontmatter.source;
		this.type = data.frontmatter.type;
		this.stack = data.frontmatter.stack;
	}

	public static async fromGlob(
		glob: Promise<MDXInstance<Record<string, any>>[]>,
		limit?: number
	): Promise<Project[]> {
		const posts = (await glob).map((p) => new Project(p));
		return ResourceBase.sortByDate(posts).slice(0, limit);
	}
}
