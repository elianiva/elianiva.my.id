<style>
.posts {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1rem 0;
  text-align: center;
}
.posts__title {
  font-family: "PT Sans", sans-serif;
  position: relative;
  display: inline-block;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
}
.posts__title::before {
  content: "";
  position: absolute;
  bottom: -0.25rem;
  height: 0.25rem;
  left: 2rem;
  right: 2rem;
  border-radius: 0.25rem;
  background-color: #ff4851;
}
.posts__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1.25rem;
  padding: 0 1rem;
}
</style>

<SEO title="Projects" />

<div class="posts">
  <h1 class="posts__title">All Projects</h1>
  <div class="posts__cards">
    {#each projects as project}
      <ProjectCard
        title={project.title}
        src={`/project/${project.slug}/cover.png`}
        href={`/project/${project.slug}`}
        desc={project.desc}
        demo={project.demo}
        source={project.source}
      />
    {/each}
  </div>
</div>

<script>
import SEO from "../../components/SEO.svelte"
import Image from "svelte-image"
import ProjectCard from "../../components/ProjectCard.svelte"
const projects = __PROJECTS__
</script>
