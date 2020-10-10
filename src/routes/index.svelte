<style lang="scss">
.main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1rem 0;
}
</style>

<svelte:head>
  <title>Home | Elianiva</title>
</svelte:head>

<main class="main">
  <Hero />
  <Section
    title="Recent Posts"
    data={posts}
    btnText="More Posts"
    url="/posts"
    type="posts"
  />
  <Section
    title="Projects"
    data={projects}
    btnText="More Projects"
    url="/projects"
    type="projects"
  />
</main>

<script>
import Hero from "../parts/Hero/index.svelte"
import Section from "../parts/Sections/index.svelte"

const posts = [
  {
    title: "My Experience Trying Out Svelte For The First Time",
    desc:
      "Phew lads, I finally tried svelte after a while and boi oh boi do I love it.",
    cover: "/posts/svelte.png",
    url: "/post/svelte",
    date: "2020-10-10",
  },
  {
    title: "How I Remember Japanese Weekdays",
    desc:
      "This will be a short post. I just want to share how I memorise Japanese weekdays (平日) or heijitsu.",
    cover: "/posts/heijitsu.png",
    url: "/post/heijitsu",
    date: "2020-10-10",
  },
  {
    title: "Making You Own Custom Startpage For Chrome",
    desc:
      "Well, I've been wanting to make my own homepage or newtab page. I thought this kind of thing is only possible in firefox.",
    cover: "/posts/chrome.png",
    url: "/post/chrome",
    date: "2020-10-10",
  },
]

const projects = [
  {
    title: "Kanaizu",
    desc: "A japanese kana quiz app built using Routify and TailwindCSS",
    cover: "/projects/kanaizu.png",
    url: "/projects/kanaizu",
    date: "2020-10-01",
    demo: "https://kanaizu.vercel.app",
    source: "https://github.com/elianiva/kanaizu",
  },
  {
    title: "Skaga",
    desc: "SMKN 3 Jember's site remake using NextJS and TailwindCSS",
    cover: "/projects/skaga.png",
    url: "/projects/skaga",
    date: "2020-10-10",
    demo: "https://skaga.vercel.app",
    source: "https://github.com/elianiva/skaga",
  },
  {
    title: "Three of Something",
    desc:
      "A website to put all of the result of a challenge that I did every week",
    cover: "/projects/tos.png",
    url: "/projects/tos",
    date: "2020-10-10",
    demo: "https://three-of-something.vercel.app",
    source: "https://github.com/elianiva/three-of-something",
  },
]
</script>
