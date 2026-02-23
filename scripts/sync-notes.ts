/**
 * Sync public notes to the private GitHub repo.
 *
 * Scans ~/Development/personal/notes, filters notes tagged `public`,
 * and pushes a notes-index.json (array of relative paths) to the repo.
 *
 * Usage: bun scripts/sync-notes.ts
 * Requires: GH_TOKEN env var with write access to the notes repo
 */

import { readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { glob } from "glob";
import matter from "gray-matter";
import { Octokit } from "octokit";

const NOTES_DIR = join(
	process.env.HOME ?? "",
	"Development",
	"personal",
	"notes",
);

const REPO_OWNER = "elianiva";
const REPO_NAME = "notes";
const INDEX_PATH = "notes-index.json";
const BRANCH = "main";

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

async function pushIndexToGithub(paths: string[], token: string) {
	const octokit = new Octokit({ auth: token });

	const content = JSON.stringify(paths, null, 2);
	const encoded = Buffer.from(content).toString("base64");

	// Check if file already exists to get its SHA (required for updates)
	let sha: string | undefined;
	try {
		const { data } = await octokit.rest.repos.getContent({
			owner: REPO_OWNER,
			repo: REPO_NAME,
			path: INDEX_PATH,
			ref: BRANCH,
		});
		if (!Array.isArray(data) && "sha" in data) {
			sha = data.sha;
		}
	} catch {
		// File doesn't exist yet — create it
	}

	await octokit.rest.repos.createOrUpdateFileContents({
		owner: REPO_OWNER,
		repo: REPO_NAME,
		path: INDEX_PATH,
		message: `chore: update notes index (${new Date().toISOString()})`,
		content: encoded,
		branch: BRANCH,
		...(sha ? { sha } : {}),
	});
}

async function main() {
	const token = process.env.GH_TOKEN;
	if (!token) {
		console.error("GH_TOKEN env var is required");
		process.exit(1);
	}

	console.log(`Scanning notes from: ${NOTES_DIR}`);
	const paths = await getPublicNotePaths();
	console.log(`Found ${paths.length} public notes`);

	console.log(`Pushing index to ${REPO_OWNER}/${REPO_NAME}...`);
	await pushIndexToGithub(paths, token);
	console.log("Done ✓");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
