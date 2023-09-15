<div class="overflow-hidden text-left bg-white z-[2] border-solid border-2 border-slate-900 shadow-sharp">
	<a
		rel="prefetch"
		{href}
		class="grid grid-rows-[4rem_2rem_8rem_2rem] text-slate-600 no-underline p-4 h-full"
	>
		<span
			class="md:hover:(text-slate-800) font-heading text-xl font-semibold leading-normal capitalize text-slate-900 transition-property-color duration-100 ease-out"
		>
			{title}
		</span>
		<div class="font-sans flex gap-1 items-center text-sm text-slate-800 border-b-2 border-slate-700">
			<CalendarIcon className="w-5 h-5 block"/>
			<span class="date__label">
				{date.toLocaleDateString("en-GB", {
					day: "numeric",
					month: "long",
					year: "numeric",
				})}
			</span>
		</div>
		<p class="font-sans leading-normal text-slate-700 py-2 text-sm">
			{@html description}
		</p>
		<div class="flex gap-4 self-end">
			{#each tags as tag}
				<Tag># {tag}</Tag>
			{/each}
		</div>
	</a>
</div>

<script lang="ts">
import CalendarIcon from "~/icons/CalendarIcon.svelte";
import Tag from "~/components/Tag.svelte";

export let title: string;
export let description: string;
export let href: string;
export let date: Date;
export let tags: string[];
</script>
