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
  <Section title="Recent Posts" data={data} btnText="More Posts" url="/posts" />
  <Section
    title="Projects"
    data={data}
    btnText="More Projects"
    url="/projects"
  />
</main>

<script>
import Hero from "../parts/Hero/index.svelte"
import Section from "../parts/Sections/index.svelte"

const data = [
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
</script>
