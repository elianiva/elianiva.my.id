<script lang="ts">
import CalendarIcon from "~icons/ph/calendar-blank";

export let title: string;
export let description: string;
export let href: string;
export let date: Date;
export let tags: string[];
</script>

<div class="overflow-hidden text-left border border-dashed border-pink-300 rounded-sm p-3">
	<a
		rel="prefetch"
		{href}
		class="grid grid-rows-[auto_2rem_auto_2rem] no-underline h-full"
	>
		<h3
			class="font-serif md:text-lg font-bold capitalize text-pink-950 hover:text-pink-800 transition-property-color duration-100 ease-out"
		>
			{title}
		</h3>
		<div class="text-xs md:text-sm font-mono flex gap-2 items-center text-pink-950/70 border-b border-dashed border-pink-300">
			<CalendarIcon className="w-4 h-4 block"/>
			<span>
				{date.toLocaleDateString("en-GB", {
					day: "numeric",
					month: "long",
					year: "numeric",
				})}
			</span>
		</div>
		<p class="font-serif leading-normal text-pink-950/70 py-2 text-sm">
			{@html description}
		</p>
		<div class="flex gap-2 self-end">
			{#each tags as tag}
				<div class="text-xs md:text-sm font-mono text-pink-950/70">#{tag}</div>
			{/each}
		</div>
	</a>
</div>
