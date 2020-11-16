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
    data={posts.splice(0, 3)}
    btnText="More Posts"
    url="/post"
    type="posts"
  />
  <Section
    title="Recent Projects"
    data={projects.splice(0, 3)}
    btnText="More Projects"
    url="/project"
    type="projects"
  />
</main>
<ProgressButton />

<script>
import SEO from "@/components/SEO.svelte"
import Hero from "@/parts/Hero.svelte"
import Section from "@/parts/Sections.svelte"
import ProgressButton from "@/components/ProgressButton.svelte"

// eslint-disable-next-line
const posts = __POSTS__
// eslint-disable-next-line
const projects = __PROJECTS__
</script>
