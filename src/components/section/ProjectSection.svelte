<script lang="ts">
import ProjectCard from "~/components/card/ProjectCard.svelte";
import type { Project } from "~/models/project.ts";

export let projects: Project[];
export let title: string;
export let description: string;
export const seeMoreUrl: string | null = null;
</script>

<section class="pt-6 md:pt-10">
	<h2 class="text-xl md:text-2xl font-bold font-serif text-pink-950">{title}</h2>
	<p class="text-xs md:text-base font-serif text-pink-950/70 pt-2 pb-4">
		{description}
	</p>
	<div class="relative grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3 pb-4">
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
		<a href={seeMoreUrl} class="uppercase font-mono text-pink-950 hover:text-pink-800 transition-colors text-sm">
			&#8213 See more
		</a>
	{/if}
</section>