<style>
.main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1rem 0;
}
</style>

<SEO title="Home"/>

<main class="main">
  <Hero />
  <Section
    title="Recent Posts"
    data={posts.splice(0, 3)}
    btnText="More Posts"
    type="posts"
  />
  <Section
    title="Projects"
    data={projects}
    btnText="More Projects"
    url="/projects"
    type="projects"
  />
  <OpenSauce />
</main>

<script>
import SEO from "../components/SEO.svelte"
import Hero from "../parts/Hero.svelte"
import Section from "../parts/Sections.svelte"
import OpenSauce from "../parts/OpenSauce.svelte"

const posts = __POSTS__

const projects = [
  {
    title: "Kanaizu",
    desc: "A japanese kana quiz app built using Routify and TailwindCSS",
    cover: "projects/kanaizu.png",
    url: "/projects/kanaizu",
    date: "2020-10-01",
    demo: "https://kanaizu.vercel.app",
    source: "https://github.com/elianiva/kanaizu",
  },
  {
    title: "Skaga",
    desc: "SMKN 3 Jember's site remake using NextJS and TailwindCSS",
    cover: "projects/skaga.png",
    url: "/projects/skaga",
    date: "2020-10-10",
    demo: "https://skaga.vercel.app",
    source: "https://github.com/elianiva/skaga",
  },
  {
    title: "Three of Something",
    desc:
      "A website to put all of the result of a challenge that I did every week",
    cover: "projects/tos.png",
    url: "/projects/tos",
    date: "2020-10-10",
    demo: "https://three-of-something.vercel.app",
    source: "https://github.com/elianiva/three-of-something",
  },
]
</script>
