<script lang="ts">
import CalendarIcon from "~icons/ph/calendar-blank";

type Props = {
	title: string;
	description: string;
	href: string;
	date: Date;
	tags: string[];
};
const { title, description, href, date, tags }: Props = $props();
</script>

<div
	class="blog-card overflow-hidden text-left border border-dashed border-pink-300 rounded-sm p-3 bg-white"
>
	<a
		data-astro-prefetch
		rel="prefetch"
		{href}
		class="grid grid-rows-[auto_2rem_auto_2rem] no-underline h-full focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 rounded-sm"
	>
		<h3
			class="font-serif md:text-lg font-bold capitalize text-pink-950 hover:text-pink-800 transition-property-color duration-100 ease-out"
		>
			{title}
		</h3>
		<div
			class="text-xs md:text-sm font-mono flex gap-2 items-center text-pink-950/70 border-b border-dashed border-pink-300"
		>
			<CalendarIcon class="w-4 h-4 block" />
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
				<div class="text-xs md:text-sm font-mono text-pink-950/70">
					#{tag}
				</div>
			{/each}
		</div>
	</a>
</div>
