<style>
:global(.section__pattern) {
  color: var(--color-main-accent);
  position: absolute;
  top: 0;
  left: -2rem;
  width: 14rem;
  height: 10rem;
}
</style>

<section
  class="relative mt-16 font-sans text-slate-800 dark:text-slate-200 text-center z-[2]"
>
  <Pattern className="section__pattern" />
  <h1
    class="font-heading relative inline-block text-2xl font-semibold mb-8 before:(content-[] absolute -bottom-1 h-1 left-8 right-8 rounded-md bg-blue-600 dark:bg-red-500)"
  >
    {title}
  </h1>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-5">
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
  <a href={url} role="button" class="btn-lg-blue-600 dark:btn-lg-red-500">
    {btnText}
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
