<div class="overflow-hidden text-left bg-white z-[2] border-2 border-rose-900 shadow-sharp">
	<a
		data-sveltekit-prefetch
		rel="prefetch"
		{href}
		class="grid grid-rows-[auto_2rem_8rem_1fr] text-zinc-600 no-underline p-4 h-full"
	>
		<span
			class="md:hover:(text-rose-700) font-heading text-xl font-semibold leading-normal capitalize text-zinc-800 transition-property-color duration-100 ease-out"
		>
			{title}
		</span>
		<div class="font-heading flex gap-1 items-center justify-self-start text-sm text-zinc-700">
			<CalendarIcon className="w-5 h-5 block -mt-1"/>
			<span class="date__label">
				{new Date(date).toLocaleDateString("en-GB", {
					day: "numeric",
					month: "long",
					year: "numeric",
				})}
			</span>
		</div>
		<p class="font-serif leading-normal text-zinc-700 mb-2 mb-4 text-lg">
			{@html description}
		</p>
		<div class="flex gap-2 self-end">
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
export let date: string;
export let tags: string[];
</script>
