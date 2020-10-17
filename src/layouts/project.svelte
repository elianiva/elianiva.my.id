<style>
.project {
  max-width: 1080px;
  display: flex;
  margin: 2rem auto;
  padding: 0 1rem;
  gap: 1rem;
}

.project__left {
  width: 70%;
}

.project__wrapper {
  border-radius: 0.5rem;
  overflow: hidden;
  border: 0.125rem #efefef solid;
  height: 26rem;
  margin-bottom: 2rem;
}

:global(.project__img) {
  width: 100%;
}

.project__title {
  font-family: "Roboto Condensed", sans-serif;
  font-size: 2rem;
}

.project__divider {
  border: none;
  height: 0.125rem;
  margin: 0.5rem 0 1rem;
  background-color: #efefef;
}

.project__content {
  font-family: "PT Sans", sans-serif;
  font-size: 1.125rem;
  line-height: 1.5rem;
}

.project__stack {
  width: 30%;
  height: 100%;
  padding: 1rem;
  border: 0.125rem #efefef solid;
  border-radius: 0.5rem;
}

.stack__title {
  font-family: "Roboto Condensed", sans-serif;
  font-weight: 600;
  font-size: 1.5rem;
}

.stack__divider {
  height: 0.125rem;
  border: none;
  background-color: #efefef;
  margin: 0.5rem 0;
}

.stack__item {
  display: grid;
  grid-template-columns: 3.5rem 1fr;
  gap: 1rem;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px #efefef solid;
}

.stack__item:last-child {
  border: none;
}

.stack__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: #fafafa;
}

.stack__logo img {
  width: 100%;
}

.stack__name {
  font-family: "Roboto Condensed", sans-serif;
  font-size: 1.25rem;
  text-decoration: none;
  color: #3a181a;
}

.stack__name:hover {
  color: #ff4851
}

.stack__name::after {
  content: "↗";
  font-size: 1rem;
  vertical-align: top;
}

</style>

<SEO
  title={title}
  thumbnail={`${data.siteUrl}/project/${currentProject.slug}/cover.png`}
/>

<section class="project">
  <main class="project__left">
    <div class="project__wrapper">
      <Image
        src={`/project/${currentProject.slug}/cover.png`}
        ratio="55%"
        alt={title}
        class="project__img"
      />
    </div>
    <div class="project__content">
      <h1 class="project__title">{title}</h1>
      <hr class="project__divider" />
      <slot />
    </div>
  </main>
  <div class="project__stack">
    <span class="stack__title">Tech Stack</span>
    <hr class="stack__divider" />
    {#each currentProject.stack as stack}
      <div class="stack__item">
        <div class="stack__logo">
          <img src="/logo/{stack[0].toLowerCase()}.png" alt={stack} />
        </div>
        <a href={stack[1]} class="stack__name">{stack[0]}</a>
      </div>
    {/each}
  </div>
</section>

<script>
import SEO from "../components/SEO.svelte"
import Image from "svelte-image"
import data from "../site-data"
export let title

const projects = __PROJECTS__
const currentProject = projects.filter(project => project.title === title)[0]
</script>
