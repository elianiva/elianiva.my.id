<script lang="ts">
import { type AnimationPlaybackControlsWithThen, animate } from "motion";
import { untrack } from "svelte";
import ArrowUpRight from "~icons/ph/arrow-up-right-duotone";
import CaretDownIcon from "~icons/ph/caret-down";
import GitPullRequestIcon from "~icons/ph/git-pull-request-duotone";
import StarIcon from "~icons/ph/star-duotone";
import type { GitHubPullRequest } from "../../types/github-pr.ts";

interface Props {
	repository: {
		name: string;
		full_name: string;
		url: string;
		stargazerCount: number;
	};
	prs: GitHubPullRequest[];
	defaultOpen?: boolean;
}

const { repository, prs, defaultOpen = false }: Props = $props();

// svelte-ignore state_referenced_locally: intentional
let isOpen = $state(defaultOpen);
let detailsEl: HTMLDivElement;
let animationRef: AnimationPlaybackControlsWithThen | null = null;

const totalChanges = $derived(
	prs.reduce((sum, pr) => sum + pr.additions + pr.deletions, 0),
);

function toggleOpen() {
	isOpen = !isOpen;

	const prefersReduced = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;

	if (prefersReduced) {
		if (detailsEl) {
			detailsEl.style.height = isOpen ? "auto" : "0px";
			detailsEl.style.opacity = isOpen ? "1" : "0";
		}
		return;
	}

	if (animationRef) {
		animationRef.stop();
	}

	if (isOpen) {
		const targetHeight = detailsEl.scrollHeight;
		detailsEl.style.height = "0px";
		detailsEl.style.opacity = "0";

		animationRef = animate(
			detailsEl,
			{ height: `${targetHeight}px`, opacity: 1 },
			{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
		);

		animationRef.then(() => {
			if (detailsEl) detailsEl.style.height = "auto";
		});
	} else {
		const currentHeight = detailsEl.scrollHeight;
		detailsEl.style.height = `${currentHeight}px`;

		animationRef = animate(
			detailsEl,
			{ height: "0px", opacity: 0 },
			{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
		);
	}
}

$effect(() => {
	if (detailsEl) {
		const initiallyOpen = untrack(() => isOpen);
		detailsEl.style.height = initiallyOpen ? "auto" : "0px";
		detailsEl.style.opacity = initiallyOpen ? "1" : "0";
	}
});
</script>

<div
	class="bg-blur-xl bg-white/50 focus:outline-none rounded-xl border-[0.5px] border-pink-200/50"
	data-open={isOpen}
>
	<button
		type="button"
		class="list-none w-full px-4 py-3 cursor-pointer focus:outline-none rounded-xl text-left"
		onclick={toggleOpen}
		aria-expanded={isOpen}
	>
		<div
			class="flex flex-row sm:items-center justify-between focus:outline-none"
		>
			<div class="flex items-center gap-2">
				<div
					class="text-pink-600 transition-transform duration-200"
					class:rotate-180={isOpen}
				>
					<CaretDownIcon class="inline-block size-3" />
				</div>

				<h3 class="text-left font-mono text-sm text-pink-800">
					<a
						class="text-pink-500 inline-flex items-center hover:text-pink-700 transition-colors"
						href="https://github.com/{repository.full_name}"
						target="_blank"
						rel="noopener noreferrer"
						onclick={(e) => e.stopPropagation()}
					>
						<span class="hidden sm:inline">
							{repository.full_name}
						</span>
						<span class="inline sm:hidden">
							{repository.full_name.split("/").at(-1)}
						</span>
						<ArrowUpRight class="inline-block size-3" />
					</a>
					(<span class="inline-flex items-center gap-1">
						<StarIcon
							class="inline size-3"
						/>{repository.stargazerCount}
					</span>)
				</h3>
			</div>

			<div class="flex-col items-end">
				<div
					class="flex items-center justify-end gap-1 font-mono text-xs text-pink-950/70"
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
	</button>

	<div bind:this={detailsEl} class="overflow-hidden">
		<div class="border-t border-pink-200/50">
			<div id="pr-details-{repository.name}" class="p-3">
				<div class="space-y-2">
					{#each prs as pr (pr.id)}
						<div
							class="not-last:border-b border-pink-200/50 not-last:pb-2"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="flex-1 min-w-0">
									<a
										href={pr.url}
										target="_blank"
										rel="noopener noreferrer"
										class="font-body text-sm font-medium text-pink-950 hover:text-pink-700 transition-colors line-clamp-2"
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
	</div>
</div>
