export type GitHubPullRequest = {
	id: string;
	number: number;
	title: string;
	state: "open" | "closed" | "merged";
	merged_at: string | null;
	created_at: string;
	updated_at: string;
	url: string;
	repository: {
		name: string;
		full_name: string;
		url: string;
		stargazerCount: number;
	};
	user: {
		login: string;
		url: string;
	};
	additions: number;
	deletions: number;
	changed_files: number;
};

export type GroupedPRs = {
	[repoName: string]: {
		repository: {
			name: string;
			full_name: string;
			url: string;
			stargazerCount: number;
		};
		prs: GitHubPullRequest[];
		mergedCount: number;
	};
};

export type GitHubLoaderOptions = {
	username: string;
	minStars: number;
};

export type GraphQLPullRequest = {
	id: string;
	number: number;
	title: string;
	state: string;
	mergedAt: string | null;
	createdAt: string;
	updatedAt: string;
	url: string;
	repository: {
		name: string;
		nameWithOwner: string;
		url: string;
		stargazerCount: number;
		isArchived: boolean;
	};
	author: {
		login: string;
		url: string;
	};
	additions: number;
	deletions: number;
	changedFiles: number;
};

export type GraphQLResponse = {
	user: {
		pullRequests: {
			pageInfo: {
				hasNextPage: boolean;
				endCursor: string | null;
			};
			nodes: GraphQLPullRequest[];
		};
	};
};
