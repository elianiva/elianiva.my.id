import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkRehype from "remark-rehype";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

export async function compileContent(content: string) {
	const file = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkFrontmatter)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypePrettyCode, { theme: "github-dark" })
		.use(rehypeStringify, { allowDangerousHtml: true })
		.process(content);
	return file.toString();
}
