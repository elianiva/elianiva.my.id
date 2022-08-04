<div class="overflow-hidden text-left bg-white dark:bg-gray-800 shadow-md rounded-md" in:fade={{ duration: 200 }}>
	<img
		class="relative block w-full h-48 object-cover bg-white dark:(bg-gray-800 brightness-95) z-[2]"
		src={imgSrc}
		alt={title}
		loading="lazy"
		data-testid="img"
	/>
	<div class="grid grid-rows-[2rem_4.5rem_1fr] p-4">
		<a
			rel="prefetch"
			{href}
			class="no-underline text-slate-600 hover:text-slate-800 dark:text-slate-400 hover:dark:text-slate-200 text-lg font-heading font-semibold leading-normal transition-[all_ease-out_0.2s]"
			data-testid="title">{title}</a
		>
		<p class="font-sans leading-normal text-slate-600 dark:text-slate-400" data-testid="desc">
			{desc}
		</p>
		<div class="flex justify-end gap-1 mt-2">
			{#if demo}
				<a
					class="font-heading no-underline flex items-center gap-2 py-1 px-2 transition-[filter_ease-out_0.2s] text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:dark:text-slate-200"
					href={demo ? demo : "#"}
					target="_blank"
					rel="norel noreferrer"
					data-testid="demo"
				>
					<GlobeIcon /> Visit
				</a>
			{/if}
			<a
				class="font-heading no-underline flex items-center gap-2 py-1 px-2 transition-[filter_ease-out_0.2s] text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:dark:text-slate-200"
				href={source}
				target="_blank"
				rel="norel noreferrer"
				data-testid="source"
			>
				<GithubIcon /> Source
			</a>
		</div>
	</div>
</div>

<script lang="ts">
import { fade } from "svelte/transition";
import GlobeIcon from "~icons/ph/globe";
import GithubIcon from "~icons/fe/github";

export let title: string;
export let imgSrc: string;
export let desc: string;
export let href: string;
export let demo: string;
export let source: string;
</script>
