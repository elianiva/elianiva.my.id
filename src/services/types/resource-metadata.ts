import type { Heading } from "./heading";

export interface ResourceMetadata {
	title: string;
	date: string;
	description: string;
	tags: string[];
	demo: string;
	source: string;
	layout: string;
	stack: [string, string][];
	slug: string;
	headings: Heading[];
	content: string;
	draft: boolean;
	minimal: boolean;
	type: string;
}
