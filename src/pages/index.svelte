<style>
.main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1rem 0;
  background-color: var(--color-main-bg);
  z-index: 2;
}

.hero {
  display: flex;
  align-items: center;
  min-height: calc(var(--mobile-vh, 1vh) * 100);
  margin: 0 auto;
  padding: 1rem 0;
}

.hero__bar {
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  background-color: var(--color-alt-bg);
  border-top: 0.0625rem var(--color-borders) solid;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 1rem;
}

.hero__buttons {
  position: relative;
  z-index: 5;
  display: flex;
}

.hero__button {
  padding: 0.75rem 2rem;
  font-size: 1.125rem;
  font-family: "Overpass", sans-serif;
  border: none;
  background-color: var(--color-main-accent);
  color: #f4f4f4;
  margin-right: 1rem;
  border-radius: 0.25rem;
  text-decoration: none;
}

.hero__button--inactive {
  padding: 0.75rem 2rem;
  background-color: var(--color-special-bg);
  color: var(--color-alt-text);
  font-family: "Overpass", sans-serif;
  font-size: 1.125rem;
  border: none;
  border-radius: 0.25rem;
  text-decoration: none;
}

.hero__button:hover,
.hero__button--inactive:hover {
  filter: brightness(0.95);
}

@media only screen and (max-width: 960px) {
  .hero {
    align-items: start;
    padding: 1rem 1rem 0;
  }

  .hero__buttons {
    justify-content: center;
  }

  .hero__button {
    display: block;
  }
  :global(.hero__pattern) {
    position: absolute;
    right: 0;
    top: 0;
    height: 6rem;
    z-index: -1;
    color: rgba(255, 72, 81, 0.075);
  }
}
</style>

<SEO title="Home" />

<div class="hero">
  <Hero />
  <div class="hero__bar">
    <div class="hero__buttons">
      <a class="hero__button" href="/project">Projects</a>
      <a class="hero__button--inactive" href="/about">About</a>
    </div>
  </div>
</div>
<Navbar position="home" segment={null} />
<main class="main">
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
<Footer />
<ProgressButton />

<script>
import { onMount } from "svelte"
import SEO from "@/components/SEO.svelte"
import Hero from "@/parts/Hero.svelte"
import Navbar from "@/components/Navbar.svelte"
import Footer from "@/components/Footer.svelte"
import Section from "@/parts/Sections.svelte"
import ProgressButton from "@/components/ProgressButton.svelte"

// eslint-disable-next-line
const posts = __POSTS__
// eslint-disable-next-line
const projects = __PROJECTS__

// calculate mobile window height *including* the browser UI
// using plain 100vh would ignore browser's UI
onMount(() => {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty("--mobile-vh", `${vh}px`)
})
</script>
