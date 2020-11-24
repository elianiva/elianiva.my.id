<style>
.section {
  position: relative;
  margin-top: 4rem;
  font-family: "Open Sans", sans-serif;
  color: var(--color-main-text);
  text-align: center;
  z-index: 2;
}

.section__title {
  font-family: "Overpass", sans-serif;
  position: relative;
  display: inline-block;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.section__title::before {
  content: "";
  position: absolute;
  bottom: -0.25rem;
  height: 0.25rem;
  left: 2rem;
  right: 2rem;
  border-radius: 0.25rem;
  background-color: var(--color-main-accent);
}

.section__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 1.25rem;
}

.section__button {
  display: inline-block;
  margin-top: 2rem;
  padding: 1rem 1.5rem 0.75rem;
  color: #f4f4f4;
  background-color: var(--color-main-accent);
  text-decoration: none;
  font-family: "Overpass", sans-serif;
  font-size: 1.25rem;
  border-radius: 0.25rem;
  transition: all ease-out 0.2s;
}

.section__button:hover {
  transform: translate3d(0, -0.25rem, 0);
  filter: brightness(1.2);
}

:global(.section__pattern) {
  color: var(--color-main-accent);
  position: absolute;
  top: 0;
  left: -2rem;
  width: 14rem;
  height: 10rem;
}

@media only screen and (max-width: 480px) {
  .section::after {
    right: 0;
  }
}
</style>

<section class="section">
  <Pattern class="section__pattern" />
  <h1 class="section__title">{title}</h1>
  <div class="section__cards">
    {#if type === 'posts'}
      {#each data as item}
        <PostCard
          title={item.title}
          href={`/post/${item.slug}`}
          desc={item.desc}
          date={item.date}
          tags={item.tags}
        />
      {/each}
    {:else}
      {#each data as item}
        <ProjectCard
          title={item.title}
          imgSrc={`/assets/project/${item.slug}/cover.png`}
          href={`/project/${item.slug}`}
          desc={item.desc}
          demo={item.demo}
          source={item.source}
        />
      {/each}
    {/if}
  </div>
  <a href={url} class="section__button">{btnText}</a>
</section>

<script>
import Pattern from "../icons/pattern.svg"
import PostCard from "../components/PostCard.svelte"
import ProjectCard from "../components/ProjectCard.svelte"
export let title, data, btnText, url, type
</script>
