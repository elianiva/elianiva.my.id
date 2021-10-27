<style>
.projects {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1rem 0;
  text-align: center;
}

.projects__title {
  font-family: var(--font-heading);
  position: relative;
  display: inline-block;
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--color-shine);
}

.projects__title::before {
  content: "";
  position: absolute;
  bottom: -0.25rem;
  height: 0.25rem;
  left: 2rem;
  right: 2rem;
  border-radius: 0.25rem;
  background-color: var(--color-main-accent);
}

.projects__desc {
  font-family: var(--font-sans);
  color: var(--color-main-text);
  font-size: 1.125rem;
  line-height: 1.75rem;
  margin-bottom: 1rem;
  text-align: left;
}

.projects__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1.25rem;
  margin-bottom: 1rem;
}
</style>

<SEO title="Projects" />

<section class="projects">
  <a href="/project#personal-projects">
    <h1 id="personal-projects" class="projects__title">Personal Projects</h1>
  </a>
  <p class="projects__desc">
    These are some projects that I do on my free time. Almost all of my Github
    projects are here, quite proud on some of them.
  </p>
  <div class="projects__cards">
    {#each projects.filter(p => p.type === "personal") as project}
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
  <h1 class="projects__title">School Projects</h1>
  <p class="projects__desc">
    These are some projects that I do for school assignments, not exactly proud
    of them since I don't like to make these kind of thing. Guess I'd put them
    here anyway in case anyone needs them for reference or something.
  </p>
  <div class="projects__cards">
    {#each projects.filter(p => p.type === "assignment") as project}
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
<Progress />

<script context="module">
export const prerender = true;
export async function load({ fetch }) {
  const projects = await (await fetch(`/api/project.json`)).json();
  return { props: { projects } };
}
</script>

<script lang="ts">
import SEO from "$lib/components/SEO.svelte";
import ProjectCard from "$lib/components/ProjectCard.svelte";
import Progress from "$lib/components/Progress.svelte";

export let projects: Array<any>;
</script>
