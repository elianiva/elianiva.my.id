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
  height: 100vh;
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
  font-family: "Roboto Condensed", sans-serif;
  border: none;
  background-color: var(--color-main-accent);
  color: var(--color-alt-bg);
  margin-right: 1rem;
  border-radius: 0.25rem;
  text-decoration: none;
  transition: all ease-out 0.2s;
}

.hero__button--inactive {
  padding: 0.75rem 2rem;
  background-color: var(--color-main-bg);
  color: var(--color-alt-text);
  font-family: "Roboto Condensed", sans-serif;
  font-size: 1.125rem;
  border: none;
  border-radius: 0.25rem;
  text-decoration: none;
  transition: all ease-out 0.2s;
}

.hero__button:hover,
.hero__button--inactive:hover {
  transform: translateY(-0.25rem);
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
      <a class="hero__button" href="/projects">Projects</a>
      <a class="hero__button--inactive" href="/about">About</a>
    </div>
  </div>
</div>
<Navbar position="home" />
<main class="main">
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
</main>
<Footer />
<ProgressButton showBar={false} />

<script>
import SEO from "@/components/SEO.svelte"
import Hero from "@/parts/Hero.svelte"
import Navbar from "@/components/Navbar.svelte"
import Footer from "@/components/Footer.svelte"
import Section from "@/parts/Sections.svelte"
import ProgressButton from "@/components/ProgressButton.svelte"

const posts = __POSTS__
const projects = __PROJECTS__
</script>
