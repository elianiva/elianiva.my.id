<script lang="ts">
	import WorkExperienceCard from "~/components/card/WorkExperienceCard.svelte";
	import type { WorkExperience } from "~/models/work-experience.ts";
	import FadingVeil from "~/components/FadingVeil.svelte";

	export let workExperiences: WorkExperience[];
	let expanded: boolean = false;
</script>

<section class="pt-10">
	<h2 class="text-2xl font-bold font-serif text-pink-950 pb-4">Work Experience</h2>
	<div class="relative flex flex-col gap-10 pb-8">
		<FadingVeil {expanded} onClick={() => expanded = !expanded} />
		{#each workExperiences.slice(0, expanded ? workExperiences.length : 2) as experience (experience.company)}
			<WorkExperienceCard {...experience} />
		{/each}
	</div>
</section>