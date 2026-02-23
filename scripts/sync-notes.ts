/**
 * Generate notes index from local notes directory.
 *
 * Scans ~/Development/personal/notes, filters notes tagged `public`,
 * and writes a notes-index.json (array of relative paths) locally.
 *
 * Usage: bun scripts/sync-notes.ts
 */

import { readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { glob } from "glob";
import matter from "gray-matter";

const NOTES_DIR = join(
	process.env.HOME ?? "",
	"Development",
	"personal",
	"notes",
);

const OUTPUT_PATH = join(process.cwd(), "notes-index.json");

const PATTERNS = [
	"Articles/**/*.md",
	"Vault/**/*.md",
	"Music/*.md",
	"People/*.md",
];

const EXCLUDE_PATTERNS = ["**/Archive/**", "**/Daily/**", "**/Inbox/**"];

async function getPublicNotePaths(): Promise<string[]> {
	const allFiles: string[] = [];

	for (const pattern of PATTERNS) {
		const files = await glob(pattern, {
			cwd: NOTES_DIR,
			absolute: true,
			ignore: EXCLUDE_PATTERNS,
		});
		allFiles.push(...files);
	}

	const publicPaths: string[] = [];

	await Promise.all(
		allFiles.map(async (filePath) => {
			const content = await readFile(filePath, "utf-8");
			const { data } = matter(content);
			const tags: string[] = data.tags ?? [];
			if (tags.includes("public")) {
				const rel = relative(NOTES_DIR, filePath).split(sep).join("/");
				publicPaths.push(rel);
			}
		}),
	);

	return publicPaths.sort();
}

async function writeIndexFile(paths: string[]) {
	const content = JSON.stringify(paths, null, 2);
	await writeFile(OUTPUT_PATH, content, "utf-8");
}

async function main() {
	console.log(`Scanning notes from: ${NOTES_DIR}`);
	const paths = await getPublicNotePaths();
	console.log(`Found ${paths.length} public notes`);
	console.log(`Writing index to ${OUTPUT_PATH}...`);
	await writeIndexFile(paths);
	console.log("Done ✓");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
