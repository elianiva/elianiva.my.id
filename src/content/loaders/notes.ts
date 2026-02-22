import { z } from "astro:content";
import { readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { Loader } from "astro/loaders";
import { glob } from "glob";
import matter from "gray-matter";

const NOTES_DIR = join(
	process.env.HOME || "",
	"Development",
	"personal",
	"notes",
);

const frontmatterSchema = z.object({
	tags: z.array(z.string()).optional(),
	created_at: z.string().optional(),
	id: z.string().optional(),
	aliases: z.array(z.string()).optional(),
	url: z.string().optional(),
	author: z.string().optional(),
	name: z.string().optional(),
	links: z.array(z.string()).optional(),
	artist: z.string().optional(),
	album: z.string().optional(),
	year: z.array(z.coerce.string()).default([]),
});

type NoteFrontmatter = z.infer<typeof frontmatterSchema>;

const noteSchema = frontmatterSchema.extend({
	id: z.string(),
	title: z.string(),
	slug: z.string(),
	category: z.enum(["article", "vault", "person", "music"]),
	tags: z.array(z.string()),
	created_at: z.coerce.date(),
	modified_at: z.coerce.date(),
	body: z.string(),
	description: z.string().optional(),
	backlinks: z.array(z.string()).default([]),
	outgoing_links: z.array(z.string()).default([]),
	year: z.array(z.coerce.string()).default([]),
});

type Note = z.infer<typeof noteSchema>;

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function extractTitle(content: string, frontmatterId?: string): string {
	if (frontmatterId) return frontmatterId;

	const h1Match = content.match(/^#\s+(.+)$/m);
	if (h1Match?.[1]) return h1Match[1].trim();

	return "Untitled";
}

// Find first paragraph that's not a heading
function extractDescription(content: string) {
	const lines = content.split("\n");
	for (const line of lines) {
		const trimmed = line.trim();
		if (
			trimmed &&
			!trimmed.startsWith("#") &&
			!trimmed.startsWith("-") &&
			!trimmed.startsWith("*") &&
			!trimmed.startsWith("[") &&
			!trimmed.startsWith("!")
		) {
			return trimmed.slice(0, 200);
		}
	}
	return "";
}

function parseWikiLinks(content: string): string[] {
	const links: string[] = [];
	const wikiLinkRegex = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
	let match: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
	while ((match = wikiLinkRegex.exec(content)) !== null) {
		if (match?.[1]) {
			links.push(match[1].trim());
		}
	}
	return links;
}

function getCategoryFromPath(filePath: string): Note["category"] {
	const relativePath = relative(NOTES_DIR, filePath);
	const parts = relativePath.split(sep);
	const topDir = parts[0]?.toLowerCase();

	switch (topDir) {
		case "articles":
			return "article";
		case "people":
			return "person";
		case "music":
			return "music";
		default:
			return "vault";
	}
}

type SyncContext = Pick<
	Parameters<Loader["load"]>[0],
	"store" | "logger" | "parseData" | "generateDigest" | "renderMarkdown"
>;

async function syncNotes({
	store,
	logger,
	parseData,
	generateDigest,
	renderMarkdown,
}: SyncContext) {
	const patterns = [
		"Articles/**/*.md",
		"Vault/**/*.md",
		"Music/*.md",
		"People/*.md",
	];

	const excludePatterns = ["**/Archive/**", "**/Daily/**", "**/Inbox/**"];

	const allFiles: string[] = [];

	for (const pattern of patterns) {
		const files = await glob(pattern, {
			cwd: NOTES_DIR,
			absolute: true,
			ignore: excludePatterns,
		});
		allFiles.push(...files);
	}

	logger.info(`Found ${allFiles.length} note files`);

	// First pass: collect all notes for backlink resolution
	const notesMap = new Map<string, Note>();
	const titleToSlug = new Map<string, string>();

	const notePromises = allFiles.map(async (filePath) => {
		try {
			const content = await readFile(filePath, "utf-8");
			const parsed = matter(content);

			const frontmatter = parsed.data as NoteFrontmatter;

			const tags = frontmatter.tags || [];
			if (!tags.includes("public")) return null;

			const relativePath = relative(NOTES_DIR, filePath);
			const pathParts = relativePath.replace(/\.md$/, "").split(sep);
			const stats = await stat(filePath);

			const note = {
				id: slugify(pathParts.join("-")),
				title: extractTitle(parsed.content, frontmatter.id),
				slug: slugify(pathParts.join("-")),
				category: getCategoryFromPath(filePath),
				tags,
				created_at: frontmatter.created_at
					? new Date(frontmatter.created_at)
					: new Date(stats.birthtime),
				modified_at: new Date(stats.mtime),
				body: parsed.content,
				description:
					parsed.content.match(/^#/)?.[0] === "#"
						? extractDescription(parsed.content)
						: "",
				url: frontmatter.url ?? "",
				author: frontmatter.author ?? "",
				name: frontmatter.name ?? "",
				links: frontmatter.links ?? [],
				artist: frontmatter.artist ?? "",
				album: frontmatter.album ?? "",
				year: frontmatter.year
					? Array.isArray(frontmatter.year)
						? frontmatter.year
						: [frontmatter.year]
					: [],
			} satisfies Note;

			return { slug: note.id, title: note.title, note };
		} catch (error) {
			logger.error(`Error loading note ${filePath}: ${error}`);
			return null;
		}
	});

	// TODO: might need p-limit in the future to limit concurrency
	const results = await Promise.all(notePromises);

	for (const result of results) {
		if (!result) continue;
		const { slug, title, note } = result;
		notesMap.set(slug, note);
		titleToSlug.set(title.toLowerCase(), slug);
	}

	logger.info(`Loaded ${notesMap.size} public notes`);

	// Second pass: resolve wiki-links and build backlink index
	const backlinkMap = new Map<string, Set<string>>();

	for (const [slug, note] of notesMap) {
		const wikiLinks = parseWikiLinks(note.body);
		for (const linkTitle of wikiLinks) {
			const targetSlug = titleToSlug.get(linkTitle.toLowerCase());
			if (targetSlug) {
				if (!backlinkMap.has(targetSlug)) {
					backlinkMap.set(targetSlug, new Set());
				}
				backlinkMap.get(targetSlug)?.add(slug);
			}
		}
	}

	// Store notes with backlinks
	store.clear();
	for (const [slug, note] of notesMap) {
		const backlinks = Array.from(backlinkMap.get(slug) || []);
		const outgoingLinks = parseWikiLinks(note.body)
			.map((title) => titleToSlug.get(title.toLowerCase()))
			.filter((s): s is string => s !== undefined);

		const noteWithLinks = {
			...note,
			backlinks,
			outgoing_links: outgoingLinks,
		};

		const data = await parseData({
			id: slug,
			data: noteWithLinks as unknown as Record<string, unknown>,
		});
		const digest = generateDigest(data);

		store.set({
			id: slug,
			data,
			digest,
			rendered: await renderMarkdown(note.body),
		});
	}

	logger.info(`Stored ${notesMap.size} notes in collection`);
}

export function notesLoader(): Loader {
	return {
		name: "notes",
		load: async ({
			store,
			logger,
			parseData,
			generateDigest,
			renderMarkdown,
			watcher,
		}) => {
			logger.info(`Loading notes from: ${NOTES_DIR}`);

			await syncNotes({
				store,
				logger,
				parseData,
				generateDigest,
				renderMarkdown,
			});

			watcher?.add(NOTES_DIR);
			watcher?.on("change", async (changedPath) => {
				if (changedPath.startsWith(NOTES_DIR) && changedPath.endsWith(".md")) {
					logger.info(`Reloading notes, changed: ${changedPath}`);
					await syncNotes({
						store,
						logger,
						parseData,
						generateDigest,
						renderMarkdown,
					});
				}
			});
		},
		schema: noteSchema,
	};
}
