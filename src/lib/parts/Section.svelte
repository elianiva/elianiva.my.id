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
  font-family: "Kalam", sans-serif;
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
  right: 3rem;
  border-radius: 0.25rem;
  background-color: var(--color-main-accent);
  transform: rotateZ(-2deg);
}

.section__title::after {
  content: "";
  position: absolute;
  bottom: -0.25rem;
  height: 0.25rem;
  left: 2.5rem;
  right: 2rem;
  border-radius: 0.25rem;
  background-color: var(--color-main-accent);
  transform: rotateZ(2deg);
}


.section__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 1.25rem;
}

.section__button {
  position: relative;
  display: inline-block;
  margin-top: 2rem;
  text-decoration: none;
  padding: 1rem 1.5rem 0.75rem;
  border-radius: 0.25rem;
  transition: all ease-out 0.2s;
  background-size: auto auto;
  background-color: var(--color-main-bg);
  background-image: repeating-linear-gradient(
    135deg,
    transparent,
    transparent 2px,
    var(--color-main-accent) 2px,
    var(--color-main-accent) 4px
  );
  border: 0.15rem var(--color-alt-text) solid;
  border-top-left-radius: 255px 18px;
  border-top-right-radius: 18px 240px;
  border-bottom-left-radius: 255px 18px;
  border-bottom-right-radius: 18px 220px;
}

.section__button::after {
  position: absolute;
  content: "";
  inset: 0;
  transform: rotateZ(2deg);
  border: 0.15rem var(--color-alt-text) solid;
  border-top-left-radius: 25px 118px;
  border-top-right-radius: 28px 240px;
  border-bottom-left-radius: 255px 18px;
  border-bottom-right-radius: 18px 220px;
}

.section__button:hover {
  transform: translate3d(0, -0.25rem, 0);
  filter: brightness(1.2);
}

.section__button-text {
  color: var(--color-main-text);
  background-color: var(--color-alt-bg);
  font-family: "Kalam", sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  padding: 0 0.5rem;
  border-top-left-radius: 255px 118px;
  border-top-right-radius: 228px 240px;
  border-bottom-left-radius: 255px 218px;
  border-bottom-right-radius: 118px 220px;
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
  <a href={url} class="section__button">
    <span class="section__button-text">{btnText}</span>
  </a>
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
