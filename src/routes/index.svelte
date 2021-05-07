<style>
.main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1rem 0;
  z-index: 2;
}
</style>

<SEO title="Home" />

<main class="main">
  <Hero />
  <Section
    title="Recent Posts"
    data={posts}
    btnText="More Posts"
    url="/post"
    type="posts"
  />
  <Section
    title="Recent Projects"
    data={projects}
    btnText="More Projects"
    url="/project"
    type="projects"
  />
</main>
<ProgressButton />

<script context="module">
export const prerender = true;
export async function load({ fetch }) {
  const posts = await (await fetch(`/api/post.json?limit=3`)).json();
  const projects = await (await fetch(`/api/project.json?limit=3`)).json();

  return { props: { posts, projects } };
}
</script>

<script lang="ts">
import SEO from "$lib/components/SEO.svelte";
import Hero from "$lib/parts/Hero.svelte";
import Section from "$lib/parts/Section.svelte";
import ProgressButton from "$lib/components/ProgressButton.svelte";

export let posts: Array<any>;
export let projects: Array<any>;
</script>
