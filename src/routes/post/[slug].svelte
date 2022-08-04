<SEO {desc} {title} />

<section class="max-w-screen-lg py-4 px-8 mx-auto text-center text-slate-600 dark:text-slate-400">
	{#if !minimal}
		<h1
			class="font-heading text-5xl uppercase max-w-[30ch] mt-12 mx-auto mb-0 font-semibold text-slate-700 dark:text-slate-300 leading-snug"
		>
			{title}
		</h1>
		<span class="font-heading block text-center text-lg leading-loose text-slate-500 dark:text-slate-600">
			Posted on
			{new Date(date).toLocaleDateString("en-GB", {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric",
			})}
		</span>
		<a
			class="relative block font-heading text-center text-lg leading-loose no-underline mb-4 text-blue-600 dark:text-red-500 hover:underline"
			href="https://github.com/elianiva/elianiva.my.id/blob/master/data/post{currentSlug}/index.svx"
			target="_blank"
			rel="norel noreferrer">Suggest An Edit</a
		>
		<div class="flex gap-2 justify-center">
			{#each tags as tag}
				<div
					class="py-1 px-2 bg-gray-200 dark:bg-gray-800 text-slate-800 dark:text-slate-200 rounded-md font-heading font-medium"
				>
					# {tag}
				</div>
			{/each}
		</div>
	{/if}
	<main
		class="font-sans mx-auto text-base text-left max-w-screen-sm prose prose-custom dark:prose-invert dark:prose-custom-invert"
		bind:this={contentContainer}
	>
		<div>
			<h1>Table of Contents</h1>
			<ul class="!pl-0">
				{#each headings as item}
					<li class="list-none list-outside {getLevelIndent(item.level)} my-1">
						<a href="#{slugify(item.value)}">
							{item.value}
						</a>
					</li>
				{/each}
			</ul>
		</div>
		{@html content}
		{#if !minimal}
			<h1>Comments</h1>
			{#if $theme === Theme.DARK}
				<div>
					<script {...getCommentOptions(true)}></script>
				</div>
			{:else}
				<div>
					<script {...getCommentOptions(false)}></script>
				</div>
			{/if}
		{/if}
	</main>
</section>
<Progress />

<script lang="ts">
import { onMount } from "svelte";
import { page } from "$app/stores";
import SEO from "$lib/components/SEO.svelte";
import Progress from "$lib/components/Progress.svelte";
import { Theme, theme } from "$lib/store/theme";
import type { Heading, ResourceMetadata } from "$lib/utils/fetch-data";
import { slugify } from "$lib/utils/slugify";

export let title = "";
export let date = Date.now();
export let desc = "";
export let tags: string[] = [];
export let minimal = false;
export let content = "";
export let headings: Heading[] = [];

const currentSlug = $page.url.pathname;

let contentContainer;
onMount(() => {
	contentContainer.querySelectorAll("h1 a, h2 a, h3 a").forEach((/** @type {HTMLAnchorElement} */ link) => {
		// use `decodeURIComponent` to handle Japanese characters
		if (!link.hash || !contentContainer.querySelectorAll(decodeURIComponent(link.hash)).length) {
			return;
		}

		link.addEventListener("click", (/** @type {MouseEvent} */ e) => {
			e.preventDefault();
			window.location.hash = /** @type {HTMLAnchorElement} */ e.target.getAttribute("href");
		});
	});
});

// since unocss can't do substring interpolation
function getLevelIndent(level: number) {
	// prettier-ignore
	switch (level) {
    case 1: return "";
    case 2: return "pl-4";
    case 3: return "pl-8";
    case 4: return "pl-16";
    case 5: return "pl-24";
    default: return "";
  }
}

const getCommentOptions = (/** @type {boolean} */ isDark) => ({
	src: "https://utteranc.es/client.js",
	repo: "elianiva/elianiva.my.id",
	"issue-term": "pathname",
	label: "Comments",
	theme: `${isDark ? "dark-blue" : "github-light"}`,
	crossorigin: "anonymous",
	async: true,
});
</script>
