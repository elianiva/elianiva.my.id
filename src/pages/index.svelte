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
export async function preload() {
  const posts = await (await this.fetch(`/api/post/all.json?limit=3`)).json()
  const projects = await (await this.fetch(`/api/project/all.json?limit=3`)).json()

  return { posts, projects }
}
</script>

<script>
import SEO from "@/components/SEO.svelte"
import Hero from "@/parts/Hero.svelte"
import Section from "@/parts/Sections.svelte"
import ProgressButton from "@/components/ProgressButton.svelte"

export let posts, projects
</script>
