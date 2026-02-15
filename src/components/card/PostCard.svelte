<script lang="ts">
import CalendarIcon from "~icons/ph/calendar-blank";

interface Props {
	title: string;
	description: string;
	href: string;
	date: Date;
	tags: string[];
}

const { title, description, href, date, tags }: Props = $props();
</script>

<div
	class="bg-white/50 rounded-xl text-left transition-all border-[0.5px] border-pink-200/50 hover:border-pink-200 group hover:bg-pink-50/50"
	role="article"
	aria-labelledby="post-title"
	style="view-transition-name: post-card-{href.split('/').pop()}"
>
	<a
		data-astro-prefetch
		rel="prefetch"
		{href}
		class="grid grid-rows-[auto_2rem_auto_2rem] p-4 h-full focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 rounded-lg"
		aria-labelledby="post-title"
	>
		<h3
			id="post-title"
			class="font-display md:text-base font-bold capitalize text-pink-950 group-hover:text-pink-700 transition-property-color duration-100 ease-out"
		>
			{title}
		</h3>
		<div
			class="text-xs flex gap-1 items-center text-pink-950/70 border-b border-pink-200/50"
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
		<p class="font-body leading-normal text-pink-950/70 pt-2 text-sm">
			{@html description}
		</p>
		<div class="flex gap-1 self-end flex-wrap">
			{#each tags as tag}
				<span class="text-xs font-mono text-pink-950/70 bg-pink-50/80 px-2 py-0.5 rounded-full">
					#{tag}
				</span>
			{/each}
		</div>
	</a>
</div>
