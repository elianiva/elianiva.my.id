<style>
.main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1rem 0;
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
    title="Projects"
    data={projects.splice(0, 3)}
    btnText="More Projects"
    url="/project"
    type="projects"
  />
  <OpenSauce />
</main>
<ProgressButton showBar={false} />

<script>
import SEO from "../components/SEO.svelte"
import Hero from "../parts/Hero.svelte"
import Section from "../parts/Sections.svelte"
import OpenSauce from "../parts/OpenSauce.svelte"
import ProgressButton from "../components/ProgressButton.svelte"

const posts = __POSTS__
const projects = __PROJECTS__
</script>
