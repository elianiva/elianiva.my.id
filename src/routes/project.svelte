<SEO title="Projects" />

<Transition {url}>
	<section class="max-w-[1080px] mx-auto pt-8 px-4 pb-0 text-center">
		<a href="/project#personal-projects">
			<h1
				id="personal-projects"
				class="font-heading relative inline-block text-3xl font-semibold mb-4 text-slate-700 dark:text-slate-300 before:(content-[] absolute -bottom-1 left-8 right-8 h-1 rounded-md bg-blue-600 dark:bg-red-500)"
			>
				Personal Projects
			</h1>
		</a>
		<p class="font-sans text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-4 text-left">
			These are some projects that I do on my free time. Almost all of my Github projects are here, quite proud on
			some of them.
		</p>
		<div class="grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-5 mb-10">
			{#each projects.filter((p) => p.type === "personal") as project}
				<ProjectCard
					title={project.title}
					imgSrc={`/assets/project/${project.slug}/cover.webp`}
					href={`/project/${project.slug}`}
					desc={project.desc}
					demo={project.demo}
					source={project.source}
				/>
			{/each}
		</div>
		<a href="/project#school-projects">
			<h1
				class="font-heading relative inline-block text-3xl font-semibold mb-4 text-slate-700 dark:text-slate-300 before:(content-[] absolute -bottom-1 left-8 right-8 h-1 rounded-md bg-blue-600 dark:bg-red-500)"
			>
				School Projects
			</h1>
		</a>
		<p class="font-sans text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-4 text-left">
			These are some projects that I do for school assignments, not exactly proud of them since I don't like to
			make these kind of thing. Guess I'd put them here anyway in case anyone needs them for reference or
			something.
		</p>
		<div class="grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-5">
			{#each projects.filter((p) => p.type === "assignment") as project}
				<ProjectCard
					title={project.title}
					imgSrc={`/assets/project/${project.slug}/cover.webp`}
					href={`/project/${project.slug}`}
					desc={project.desc}
					demo={project.demo}
					source={project.source}
				/>
			{/each}
		</div>
	</section>
</Transition>
<Progress />

<script lang="ts">
import SEO from "$lib/components/SEO.svelte";
import ProjectCard from "$lib/components/ProjectCard.svelte";
import Progress from "$lib/components/Progress.svelte";
import type { ResourceMetadata } from "$lib/utils/fetch-data";
import Transition from "$lib/components/Transition.svelte";

export let projects: ResourceMetadata[];
export let url: string;
</script>
