import { z } from "astro:content";
import { GH_TOKEN } from "astro:env/server";
import { readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { Loader } from "astro/loaders";
import { glob } from "glob";
import matter from "gray-matter";

const LOCAL_NOTES_DIR = join(
	process.env.HOME ?? "",
	"Development",
	"personal",
	"notes",
);

const REPO_OWNER = "elianiva";
const REPO_NAME = "elianiva.my.id";
const NOTES_REPO_NAME = "notes";
const BRANCH = "master";
const INDEX_PATH = "notes-index.json";

const PATTERNS = [
	"Articles/**/*.md",
	"Vault/**/*.md",
	"Music/*.md",
	"People/*.md",
];

const EXCLUDE_PATTERNS = ["**/Archive/**", "**/Daily/**", "**/Inbox/**"];

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

export const noteSchema = frontmatterSchema.extend({
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

type NoteFrontmatter = z.infer<typeof frontmatterSchema>;
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

function extractDescription(content: string): string {
	for (const line of content.split("\n")) {
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
		if (match?.[1]) links.push(match[1].trim());
	}
	return links;
}

function getCategoryFromRelPath(relPath: string): Note["category"] {
	const topDir = relPath.split("/")[0]?.toLowerCase();
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

function buildNote(
	relPath: string,
	content: string,
	mtime: Date,
	birthtime: Date,
): Note | null {
	const parsed = matter(content);
	const frontmatter = parsed.data as NoteFrontmatter;

	const tags = frontmatter.tags ?? [];
	if (!tags.includes("public")) return null;

	const pathParts = relPath.replace(/\.md$/, "").split("/");

	return {
		id: slugify(pathParts.join("-")),
		title: extractTitle(parsed.content, frontmatter.id),
		slug: slugify(pathParts.join("-")),
		category: getCategoryFromRelPath(relPath),
		tags,
		created_at: frontmatter.created_at
			? new Date(frontmatter.created_at)
			: birthtime,
		modified_at: mtime,
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
		backlinks: [],
		outgoing_links: [],
	} satisfies Note;
}

type SyncContext = Pick<
	Parameters<Loader["load"]>[0],
	"store" | "logger" | "parseData" | "generateDigest" | "renderMarkdown"
>;

async function storeNotes(notesMap: Map<string, Note>, ctx: SyncContext) {
	const { store, parseData, generateDigest, renderMarkdown } = ctx;

	const titleToSlug = new Map<string, string>();
	for (const [slug, note] of notesMap) {
		titleToSlug.set(note.title.toLowerCase(), slug);
	}

	const backlinkMap = new Map<string, Set<string>>();
	for (const [slug, note] of notesMap) {
		for (const linkTitle of parseWikiLinks(note.body)) {
			const targetSlug = titleToSlug.get(linkTitle.toLowerCase());
			if (targetSlug) {
				if (!backlinkMap.has(targetSlug)) {
					backlinkMap.set(targetSlug, new Set());
				}
				backlinkMap.get(targetSlug)?.add(slug);
			}
		}
	}

	store.clear();
	for (const [slug, note] of notesMap) {
		const backlinks = Array.from(backlinkMap.get(slug) ?? []);
		const outgoing_links = parseWikiLinks(note.body)
			.map((t) => titleToSlug.get(t.toLowerCase()))
			.filter((s): s is string => s !== undefined);

		const noteWithLinks = { ...note, backlinks, outgoing_links };
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
}

async function loadFromFs(ctx: SyncContext) {
	const { logger } = ctx;
	logger.info(`Loading notes from local fs: ${LOCAL_NOTES_DIR}`);

	const allFiles: string[] = [];
	for (const pattern of PATTERNS) {
		const files = await glob(pattern, {
			cwd: LOCAL_NOTES_DIR,
			absolute: true,
			ignore: EXCLUDE_PATTERNS,
		});
		allFiles.push(...files);
	}

	logger.info(`Found ${allFiles.length} note files`);

	const notesMap = new Map<string, Note>();

	await Promise.all(
		allFiles.map(async (filePath) => {
			try {
				const [content, stats] = await Promise.all([
					readFile(filePath, "utf-8"),
					stat(filePath),
				]);
				const relPath = relative(LOCAL_NOTES_DIR, filePath)
					.split(sep)
					.join("/");
				const note = buildNote(relPath, content, stats.mtime, stats.birthtime);
				if (note) notesMap.set(note.id, note);
			} catch (err) {
				logger.error(`Error loading ${filePath}: ${err}`);
			}
		}),
	);

	logger.info(`Loaded ${notesMap.size} public notes`);
	await storeNotes(notesMap, ctx);
	logger.info(`Stored ${notesMap.size} notes`);
}

async function loadFromGithub(ctx: SyncContext, token: string) {
	const { logger } = ctx;
	logger.info(`Loading notes from GitHub: ${REPO_OWNER}/${NOTES_REPO_NAME}`);

	const indexUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${INDEX_PATH}`;
	const indexRes = await fetch(indexUrl, {
		headers: { Authorization: `Bearer ${token}` },
	});

	if (!indexRes.ok) {
		throw new Error(
			`Failed to fetch notes index: ${indexRes.status} ${indexRes.statusText}`,
		);
	}

	const paths: string[] = await indexRes.json();
	logger.info(`Index has ${paths.length} public notes`);

	const notesMap = new Map<string, Note>();
	const now = new Date();

	// Fetch all .md files in parallel using raw.githubusercontent.com
	await Promise.all(
		paths.map(async (relPath) => {
			const encoded = relPath.split("/").map(encodeURIComponent).join("/");
			const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${NOTES_REPO_NAME}/${BRANCH}/${encoded}`;

			try {
				const res = await fetch(url, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				if (!res.ok) {
					logger.error(
						`Failed to fetch ${relPath}: ${res.status} ${res.statusText}`,
					);
					return;
				}
				const content = await res.text();
				// raw.githubusercontent.com doesn't expose file timestamps — use now as fallback
				const note = buildNote(relPath, content, now, now);
				if (note) notesMap.set(note.id, note);
			} catch (err) {
				logger.error(`Error fetching ${relPath}: ${err}`);
			}
		}),
	);

	logger.info(`Loaded ${notesMap.size} public notes`);
	await storeNotes(notesMap, ctx);
	logger.info(`Stored ${notesMap.size} notes`);
}

export function notesLoader(): Loader {
	return {
		name: "notes",
		schema: noteSchema,
		load: async ({
			store,
			logger,
			parseData,
			generateDigest,
			renderMarkdown,
			watcher,
		}) => {
			const ctx: SyncContext = {
				store,
				logger,
				parseData,
				generateDigest,
				renderMarkdown,
			};

			const isProd = import.meta.env.PROD;

			if (isProd) {
				await loadFromGithub(ctx, GH_TOKEN);
			} else {
				await loadFromFs(ctx);

				watcher?.add(LOCAL_NOTES_DIR);
				watcher?.on("change", async (changedPath) => {
					if (
						changedPath.startsWith(LOCAL_NOTES_DIR) &&
						changedPath.endsWith(".md")
					) {
						logger.info(`Reloading notes, changed: ${changedPath}`);
						await loadFromFs(ctx);
					}
				});
			}
		},
	};
}
