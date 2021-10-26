<style>
.section {
  position: relative;
  margin-top: 4rem;
  font-family: var(--font-sans);
  color: var(--color-shine);
  text-align: center;
  z-index: 2;
}

.section__title {
  font-family: var(--font-heading);
  position: relative;
  display: inline-block;
  font-size: 1.5rem;
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
  color: var(--color-main-text);
  background-color: var(--color-alt-bg);
  border: 0.0625rem var(--color-borders) solid;
  text-decoration: none;
  font-family: var(--font-heading);
  font-size: 1.25rem;
  transition: transform ease-out 0.2s;
}

.section__button:hover {
  transform: translate3d(0, -0.25rem, 0);
  color: var(--color-shine);
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
  <Pattern className="section__pattern" />
  <h1 class="section__title">{title}</h1>
  <div class="section__cards">
    {#if type === "posts"}
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
          imgSrc={`/assets/project/${item.slug}/cover.webp`}
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

<script lang="ts">
import Pattern from "$lib/icons/Pattern.svelte";
import PostCard from "$lib/components/PostCard.svelte";
import ProjectCard from "$lib/components/ProjectCard.svelte";

export let title: string;
export let data: Array<Record<string, any>>;
export let btnText: string;
export let url: string;
export let type: "posts" | "projects";
</script>
