<script lang="ts">
	import CaretDownIcon from "~icons/ph/caret-down";
	import ArrowUpRight from "~icons/ph/arrow-up-right-duotone";
	import StarIcon from "~icons/ph/star-duotone";
	import GitPullRequestIcon from "~icons/ph/git-pull-request-duotone";
	import type { GitHubPullRequest } from "../../types/github-pr.ts";

	export let repository: {
		name: string;
		full_name: string;
		url: string;
		stargazerCount: number;
	};
	export let prs: GitHubPullRequest[];

	$: totalChanges = prs.reduce(
		(sum, pr) => sum + pr.additions + pr.deletions,
		0,
	);
</script>

<details
	class="border border-pink-300 border-dashed rounded-sm overflow-hidden group mb-2"
>
	<summary
		class="list-none w-full px-3 py-2 bg-white cursor-pointer focus:outline-none"
	>
		<div class="flex flex-col sm:flex-row items-center justify-between">
			<div class="flex items-center gap-2">
				<div
					class="text-pink-600 transition-transform duration-200 group-open:rotate-180"
				>
					<CaretDownIcon class="inline-block size-3" />
				</div>

				<h3 class="text-left font-mono text-sm text-pink-800">
					<a
						class="text-pink-500 inline-flex items-center"
						href="https://github.com/{repository.full_name}"
						target="_blank"
						rel="noopener noreferrer"
					>
						{repository.full_name} <ArrowUpRight class="inline-block size-3" />
					</a>
					(<span class="inline-flex items-center gap-1">
						<StarIcon
							class="inline size-3"
						/>{repository.stargazerCount}
					</span>)
				</h3>
			</div>

			<div class="flex sm:flex-col items-end">
				<div
					class="flex items-center gap-2 font-mono text-xs text-pink-950/70"
				>
					<GitPullRequestIcon class="w-4 h-4 text-teal-500" />
					<p>
						<span class="font-bold">{prs.length}</span>
						PR{prs.length !== 1 ? "s" : ""}
					</p>
				</div>
				<p class="font-mono text-xs text-pink-950/50">
					{totalChanges.toLocaleString()} changes
				</p>
			</div>
		</div>
	</summary>

	<div class="border-t border-pink-300 border-dashed">
		<div id="pr-details-{repository.name}" class="p-2">
			<div class="space-y-2">
				{#each prs as pr (pr.id)}
					<div
						class="not-last:border-b border-pink-300 border-dashed not-last:pb-2"
					>
						<div class="flex items-start justify-between gap-3">
							<div class="flex-1 min-w-0">
								<a
									href={pr.url}
									target="_blank"
									rel="noopener noreferrer"
									class="font-serif text-sm font-medium text-pink-950 hover:text-pink-700 transition-colors line-clamp-2"
								>
									{pr.title}
								</a>
								<p
									class="font-mono text-xs text-pink-950/50 mt-1"
								>
									#{pr.number} • merged {new Date(
										pr.merged_at || "",
									).toLocaleDateString()}
								</p>
							</div>
							<div
								class="flex flex-col items-end gap-1 text-xs font-mono text-pink-950/70"
							>
								<div class="flex items-center gap-1">
									<span class="text-green-600"
										>+{pr.additions}</span
									>
									<span class="text-red-600"
										>-{pr.deletions}</span
									>
								</div>
								<div class="text-pink-950/50">
									{pr.changed_files} file{pr.changed_files !==
									1
										? "s"
										: ""}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</details>
