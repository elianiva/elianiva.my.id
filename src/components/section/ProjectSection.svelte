<script lang="ts">
	import ProjectCard from "~/components/card/ProjectCard.svelte";
	import type { Project } from "~/models/project.ts";

	export let projects: Project[];
	export let title: string;
	export let description: string;
	export let seeMoreUrl: string | null = null;
</script>

<section class="pt-10">
	<h2 class="text-2xl font-bold font-serif text-pink-950">{title}</h2>
	<p class="font-serif text-pink-950/70 pt-2 pb-4">
		{description}
	</p>
	<div class="relative grid grid-cols-3 gap-3 pb-4">
		{#each projects as project (project.data.title)}
			<ProjectCard
				title={project.data.title}
				description={project.data.description}
				href={`/projects/${project.slug}`}
				stack={project.data.stack}
			/>
		{/each}
	</div>
	{#if seeMoreUrl !== null}
		<a href={seeMoreUrl} class="uppercase font-mono text-pink-950 text-sm">
			&#8213 See more
		</a>
	{/if}
</section>