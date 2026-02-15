<script lang="ts">
import { type AnimationPlaybackControlsWithThen, animate } from "motion";
import { untrack } from "svelte";

interface Props {
	company: string;
	location: string;
	time: string;
	position: string;
	period: [start: Date, end: Date | null];
	details: string[];
	technologies: string[];
	defaultOpen?: boolean;
}

let {
	company,
	location,
	time,
	position,
	period,
	details,
	technologies,
	defaultOpen = false,
}: Props = $props();

// svelte-ignore state_referenced_locally: intentional
let isOpen = $state(defaultOpen);
let detailsEl: HTMLDivElement;
let animationRef: AnimationPlaybackControlsWithThen | null = null;

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
		// Opening animation - animate from 0 to auto
		const targetHeight = detailsEl.scrollHeight;
		detailsEl.style.height = "0px";
		detailsEl.style.opacity = "0";

		animationRef = animate(
			detailsEl,
			{
				height: `${targetHeight}px`,
				opacity: 1,
			},
			{
				duration: 0.35,
				ease: [0.25, 0.46, 0.45, 0.94],
			},
		);

		animationRef.then(() => {
			if (detailsEl) {
				detailsEl.style.height = "auto";
			}
		});
	} else {
		// Closing animation - animate to 0
		const currentHeight = detailsEl.scrollHeight;
		detailsEl.style.height = `${currentHeight}px`;

		animationRef = animate(
			detailsEl,
			{
				height: "0px",
				opacity: 0,
			},
			{
				duration: 0.25,
				ease: [0.25, 0.46, 0.45, 0.94],
			},
		);
	}
}

// Initialize on mount - set initial styles without animation
$effect(() => {
	if (detailsEl) {
		const initiallyOpen = untrack(() => isOpen);
		// Set initial styles immediately without animation
		detailsEl.style.height = initiallyOpen ? "auto" : "0px";
		detailsEl.style.opacity = initiallyOpen ? "1" : "0";
	}
});
</script>

<div
	class="work-experience-card group -ml-6 rounded-2xl transition-colors hover:bg-pink-50/30"
	data-open={isOpen}
>
	<button
		type="button"
		class="list-none w-full cursor-pointer focus:outline-none rounded-2xl p-2 text-left"
		onclick={toggleOpen}
		aria-expanded={isOpen}
	>
		<div
			class="flex flex-col gap-0 md:gap-2 md:flex-row items-start md:justify-between"
		>
			<div class="flex items-start gap-3">
				<div
					class="text-pink-600 transition-transform duration-200"
					class:rotate-180={isOpen}
				>
					<svg
						class="inline-block size-4 mt-1"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div>
					<div
						class="flex flex-col md:flex-row items-start md:items-center md:gap-2"
					>
						<h3
							class="font-bold font-display md:text-lg text-pink-950"
						>
							{company}
						</h3>
						<div class="flex items-center gap-2 pt-1 md:pt-0">
							<span
								class="text-xs px-3 py-1 rounded-full bg-pink-50 font-mono uppercase border border-pink-100"
							>
								{location}
							</span>
							<span
								class="text-xs px-3 py-1 rounded-full bg-pink-50 font-mono uppercase border border-pink-100"
							>
								{time}
							</span>
						</div>
					</div>
					<span class="text-sm md:text-base font-mono text-pink-950">
						{position}
					</span>
				</div>
			</div>
			<div
				class="hidden md:block md:flex-1 border-t border-pink-200/50 mt-[0.5lh]"
			></div>
			<span
				class="text-pink-950/80 font-mono text-sm md:text-base md:pl-0 pl-7"
			>
				{period[0].toLocaleDateString("en-GB", {
					month: "short",
					year: "numeric",
				})}
				-
				{period[1] === null
					? "Present"
					: period[1].toLocaleDateString("en-GB", {
							month: "short",
							year: "numeric",
						})}
			</span>
		</div>
		<div bind:this={detailsEl} class="overflow-hidden">
			<ul class="list-disc list-outside pl-11">
				{#each details as detail}
					<li
						class="text-sm md:text-base leading-relaxed font-body text-pink-950/80"
					>
						{detail}
					</li>
				{/each}
			</ul>
			<ul class="flex flex-wrap items-center pt-2 gap-2 pl-7">
				{#each technologies as technology}
					<li
						class="font-mono uppercase text-pink-950 text-xs rounded-full border border-dashed border-pink-400/60 py-1 px-3 stitch-border"
					>
						{technology}
					</li>
				{/each}
			</ul>
		</div>
	</button>
</div>
