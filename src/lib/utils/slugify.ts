export function slugify(content: string) {
	return content
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^\w-]+/g, "");
}
