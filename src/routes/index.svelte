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
  <Header />
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
<Progress />

<script context="module" lang="ts">
export const prerender = true;
export async function load({ fetch }) {
  const [posts, projects] = await Promise.all([
    fetch(`/api/post.json?limit=3`).then((x: Response) => x.json()),
    fetch(`/api/project.json?limit=3&type=personal`).then((x: Response) => x.json()),
  ]);

  return {
    props: { posts, projects },
  };
}
</script>

<script lang="ts">
import SEO from "$lib/components/SEO.svelte";
import Header from "$lib/parts/Header.svelte";
import Section from "$lib/parts/Section.svelte";
import Progress from "$lib/components/Progress.svelte";
import type { ResourceMetadata } from "$lib/utils/fetch-data";

export let posts: Array<ResourceMetadata>;
export let projects: Array<ResourceMetadata>;
</script>
