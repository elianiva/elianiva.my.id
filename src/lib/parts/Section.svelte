<style>
.section__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 1.25rem;
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

<section
  class="relative mt-16 font-sans text-slate-800 dark:text-slate-200 text-center z-[2]"
>
  <Pattern className="section__pattern" />
  <h1
    class="font-heading relative inline-block text-2xl font-semibold mb-8 before:content-[''] before:absolute before:-bottom-1 before:h-1 before:left-8 before:right-8 before:rounded-md before:bg-blue-600 before:dark:bg-red-500"
  >
    {title}
  </h1>
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
  <a
    href={url}
    class="inline-block mt-8 px-5 py-2 text-white bg-blue-600 dark:bg-red-500 rounded-md shadow-md no-underline font-heading text-lg tracking-wide transition-[transform_ease-out_0.2s] hover:-translate-y-1 transform-gpu"
    >{btnText}</a
  >
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
