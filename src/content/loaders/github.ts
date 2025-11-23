import { z } from "astro:content";
import { GH_TOKEN } from "astro:env/server";
import type { Loader } from "astro/loaders";
import { Octokit } from "octokit";
import type {
	GitHubLoaderOptions,
	GitHubPullRequest,
	GraphQLPullRequest,
	GraphQLResponse,
} from "../../types/github-pr";

const octokit = new Octokit({ auth: GH_TOKEN });

const GET_PRS_QUERY = `
	query GetPRs($username: String!, $endCursor: String) {
		user(login: $username) {
			pullRequests(
				first: 100
				after: $endCursor
				states: MERGED
				orderBy: { field: CREATED_AT, direction: DESC }
			) {
				pageInfo {
					hasNextPage
					endCursor
				}
				nodes {
					id
					number
					title
					state
					mergedAt
					createdAt
					updatedAt
					url
					repository {
						name
						nameWithOwner
						url
						stargazerCount
						isArchived
					}
					author {
						login
						url
					}
					additions
					deletions
					changedFiles
				}
			}
		}
	}
`;

async function* getAllMergedPullRequests(
	username: string,
): AsyncGenerator<GraphQLPullRequest, void, void> {
	let endCursor: string | null = null;
	let hasNextPage = true;

	while (hasNextPage) {
		const response = (await octokit.graphql<GraphQLResponse>(GET_PRS_QUERY, {
			username,
			endCursor,
		})) as GraphQLResponse;

		const { pullRequests } = response.user;

		for (const pr of pullRequests.nodes) {
			yield pr;
		}

		hasNextPage = pullRequests.pageInfo.hasNextPage;
		endCursor = pullRequests.pageInfo.endCursor;
	}
}

export function githubLoader(options: GitHubLoaderOptions): Loader {
	return {
		name: "github",
		load: async ({ store, logger, parseData, generateDigest }) => {
			logger.info(`Loading GitHub PRs for user: ${options.username}`);

			try {
				store.clear();

				const allPRs: GitHubPullRequest[] = [];

				for await (const pr of getAllMergedPullRequests(options.username)) {
					if (
						pr.repository.stargazerCount < options.minStars ||
						pr.repository.isArchived
					) {
						continue;
					}

					const normalized: GitHubPullRequest = {
						id: pr.id,
						number: pr.number,
						title: pr.title,
						state: pr.state.toLowerCase() as "open" | "closed" | "merged",
						merged_at: pr.mergedAt,
						created_at: pr.createdAt,
						updated_at: pr.updatedAt,
						url: pr.url,
						repository: {
							name: pr.repository.name,
							full_name: pr.repository.nameWithOwner,
							url: pr.repository.url,
							stargazerCount: pr.repository.stargazerCount,
						},
						user: {
							login: pr.author.login,
							url: pr.author.url,
						},
						additions: pr.additions,
						deletions: pr.deletions,
						changed_files: pr.changedFiles,
					};

					allPRs.push(normalized);

					const data = await parseData({
						id: `${normalized.repository.name}-${normalized.number}`,
						data: normalized as unknown as Record<string, unknown>,
					});
					const digest = generateDigest(data);
					store.set({
						id: `${normalized.repository.name}-${normalized.number}`,
						data,
						digest,
					});
				}

				logger.info(
					`Loaded ${allPRs.length} GitHub PRs for user: ${options.username}`,
				);
			} catch (error) {
				logger.error(`Error loading GitHub PRs: ${error}`);
			}
		},
		schema: z.object({
			id: z.string(),
			number: z.number(),
			title: z.string(),
			state: z.enum(["open", "closed", "merged"]),
			merged_at: z.string().nullable(),
			created_at: z.string(),
			updated_at: z.string(),
			url: z.string().url(),
			repository: z.object({
				name: z.string(),
				full_name: z.string(),
				url: z.string().url(),
				stargazerCount: z.number(),
			}),
			user: z.object({
				login: z.string(),
				url: z.string().url(),
			}),
			additions: z.number(),
			deletions: z.number(),
			changed_files: z.number(),
		}),
	};
}
