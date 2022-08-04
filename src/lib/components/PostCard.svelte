<div class="overflow-hidden text-left bg-white dark:bg-gray-800 z-[2] rounded-md shadow-md">
	<a
		sveltekit:prefetch
		rel="prefetch"
		{href}
		class="grid grid-rows-[2fr_2rem_5.5rem_1fr] text-slate-600 dark:text-slate-400 no-underline p-4 h-full"
	>
		<span
			class="md:hover:(text-slate-800 dark:text-slate-200) font-heading text-xl font-semibold leading-normal capitalize text-slate-600 dark:text-slate-400 transition-property-color duration-100 ease-out"
			data-testid="title"
		>
			{title}
		</span>
		<div class="font-heading flex gap-2 items-center justify-self-start text-sm text-slate-400 dark:text-slate-500">
			<CalendarIcon className="w-4 h-4 block -mt-1" />
			<span class="date__label" data-testid="date">
				{new Date(date).toLocaleDateString("en-GB", {
					day: "numeric",
					month: "long",
					year: "numeric",
				})}
			</span>
		</div>
		<p class="font-sans leading-normal text-slate-600 dark:text-slate-400 mb-1 pt-2" data-testid="desc">
			{@html desc}
		</p>
		<div class="flex gap-2 self-end">
			{#each tags as tag}
				<span
					class="font-heading font-medium bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-sm no-underline gap-2 py-1 px-2 mt-2 rounded-md capitalize transition-property-filter duration-200 ease-out"
					data-testid="tag"
				>
					# {tag}
				</span>
			{/each}
		</div>
	</a>
</div>

<script lang="ts">
import CalendarIcon from "~icons/ph/calendar-blank-bold";

export let title: string;
export let desc: string;
export let href: string;
export let date: string;
export let tags: Array<string>;
</script>
