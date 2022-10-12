import type { MDXInstance } from "astro";

export class ResourceBase {
	public readonly title: string;
	public readonly slug: string;
	public readonly description: string;
	public readonly date: string;

	public constructor(data: MDXInstance<Record<string, any>>) {
		if (!("url" in data) || data.url === undefined || data.url?.length === 0) {
			throw new Error("url is required");
		}

		if (!("title" in data.frontmatter) || data.frontmatter.title?.length === 0) {
			throw new Error("title is required");
		}

		if (!("description" in data.frontmatter) || data.frontmatter.description?.length === 0) {
			throw new Error("description is required");
		}

		if (!("date" in data.frontmatter) || data.frontmatter.date?.length === 0) {
			throw new Error("date is required");
		}

		this.title = data.frontmatter.title;
		this.slug = this.transformUrlToSlug(data.url);
		this.date = data.frontmatter.date;
		this.description = data.frontmatter.description;
	}

	public static sortByDate<T extends ResourceBase>(resources: T[]): T[] {
		return resources.sort((a, b) => (new Date(a.date) < new Date(b.date) ? 1 : -1));
	}

	private transformUrlToSlug(url: string): string {
		const slug = url.split("/").at(-1);
		if (slug === undefined) {
			throw new Error("invalid filename");
		}
		return slug;
	}
}
