<SEO {title} {desc} thumbnail={`${data.siteUrl}${currentSlug}/cover.webp`} />

<Transition {url}>
	<section
		class="max-w-screen-lg grid grid-cols-[2fr_1fr] grid-rows-[repeat(3,minmax(min-content,max-content))] grid-flow-row-dense items-start my-8 mx-auto px-4 gap-4"
	>
		<div class="col-start-1 col-end-3 md:col-start-1 md:col-end-2 w-full">
			<div class="overflow-hidden rounded-md border border-gray-300 dark:border-gray-700">
				<img
					src={`/assets${currentSlug}/cover.webp`}
					alt={title}
					class="block w-full h-full dark:brightness-95"
					loading="lazy"
				/>
			</div>
		</div>
		<div class="col-start-1 col-end-3 md:col-start-1 md:col-end-2 font-sans text-lg leading-relaxed">
			<div class="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
				<h1 class="text-slate-700 dark:text-slate-300 font-heading text-3xl font-semibold">
					{title}
				</h1>
				<div class="flex gap-2">
					{#if demo}
						<a class="btn-demo" href={demo} target="_blank" rel="norel noreferrer">
							<GlobeIcon /> Visit
						</a>
					{/if}
					<a class="btn-source" href={source} target="_blank" rel="norel noreferrer">
						<GithubIcon /> Source
					</a>
				</div>
			</div>
			<hr class="border-none h-1px mt-2 mx-0 mb-4 bg-gray-300 dark:bg-gray-700" />
			<main class="prose prose-custom dark:prose-custom-invert dark:prose-invert">
				{@html content}
			</main>
		</div>
		<div
			class="col-start-1 md:col-start-2 col-end-3 row-start-2 md:row-start-1 row-end-3 md:-row-end-1 w-full p-4 rounded-md border border-gray-300 dark:border-gray-700"
		>
			<span class="text-slate-700 dark:text-slate-300 font-semibold font-heading text-2xl"> Tech Stack </span>
			<hr class="h-1px border-none bg-gray-300 dark:bg-gray-700 my-2" />
			{#each stack as item}
				<div
					class="grid grid-cols-[3.5rem_1fr] gap-4 items-center py-4 border-b-1 border-gray-300 dark:border-gray-700 last:border-none"
				>
					<div
						class="flex items-center justify-center p-2 rounded-md bg-gray-200 dark:bg-gray-800 overflow-hidden aspect-1"
					>
						<img
							class="w-full"
							src="/assets/logo/{item[0].toLowerCase().replace(/\s+/g, '-')}.png"
							alt={item}
							style="filter: {item[0].toLowerCase() === 'nextjs' ? 'var(--filter-invert)' : ''} "
						/>
					</div>
					<a
						href={item[1]}
						class="text-slate-600 dark:text-slate-400 font-heading text-xl no-underline hover:(text-blue-600 dark:text-red-500)"
						target="_blank"
						rel="norel noreferrer">{item[0]}</a
					>
				</div>
			{/each}
		</div>
	</section>
</Transition>

<Progress />

<script>
import { page } from "$app/stores";
import GlobeIcon from "~icons/ph/globe";
import GithubIcon from "~icons/fe/github";
import SEO from "$lib/components/SEO.svelte";
import Progress from "$lib/components/Progress.svelte";
import data from "$lib/data/site";
import Transition from "$lib/components/Transition.svelte";

export let title = "";
export let desc = "";
export let demo = "";
export let source = "";
export let stack = [];
export let content = "";
export let url = "";

const currentSlug = $page.url.pathname;
</script>
