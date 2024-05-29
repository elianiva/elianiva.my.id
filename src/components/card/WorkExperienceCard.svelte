<script lang="ts">
	import { fade } from "svelte/transition"

	export let company: string;
	export let type: string;
	export let position: string;
	export let period: [start: Date, end: Date];
	export let details: string[];
	export let technologies: string[];
</script>

<div transition:fade>
	<div class="flex flex-col md:flex-row items-start justify-between">
		<div>
			<div class="flex items-center gap-2">
				<h3 class="font-bold font-serif md:text-lg text-pink-950">
					{company}
				</h3>
				<span class="text-xs px-2 py-1 rounded-sm bg-pink-100 font-mono uppercase">{type}</span>
			</div>
			<span class="text-sm md:text-base font-mono text-pink-950">{position}</span>
		</div>
		<span class="text-pink-950/80 font-mono text-sm md:text-base">
			{period[0].toLocaleDateString("en-GB", {month: "short", year: "numeric"})}
			-
			{#if period[1] === null}
				Present
			{:else}
				{period[1].toLocaleDateString("en-GB", {month: "short", year: "numeric"})}
			{/if}
		</span>
	</div>
	<ul class="pt-2 list-disc list-outside pl-4">
		{#each details as detail (detail)}
			<li class="text-sm md:text-base font-serif text-pink-950/80">
				{detail}
			</li>
		{/each}
	</ul>
	<ul class="flex flex-wrap items-center pt-2 gap-2">
		{#each technologies as technology (technology)}
			<li class="flex gap-2 items-center font-mono uppercase text-pink-950 gap-1 text-xs rounded-sm border border-dashed border-pink-400 p-1">
				{technology}
			</li>
		{/each}
	</ul>
</div>