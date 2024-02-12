<script lang="ts">
	import WorkExperienceCard from "~/components/card/WorkExperienceCard.svelte";
	import type { WorkExperience } from "~/models/work-experience.ts";

	export let workExperiences: WorkExperience[];
</script>

<section class="pt-10">
	<h2 class="text-2xl font-bold font-serif text-pink-950 pb-4">Work Experience</h2>
	<div class="relative flex flex-col gap-10 pb-8">
		{#each workExperiences as experience (experience.company)}
			<WorkExperienceCard {...experience} />
		{/each}
	</div>
</section>