<SEO {desc} {title} />

<section
  class="max-w-screen-lg py-4 px-8 mx-auto text-center text-slate-600 dark:text-slate-400"
>
  {#if !minimal}
    <h1
      class="font-heading text-5xl uppercase max-w-[30ch] mt-12 mx-auto mb-0 font-semibold text-slate-700 dark:text-slate-300 leading-snug"
    >
      {title}
    </h1>
    <span
      class="font-heading block text-center text-lg leading-loose text-slate-500 dark:text-slate-600"
    >
      Posted on
      {new Date(date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    </span>
    <a
      class="relative block font-heading text-center text-lg leading-loose no-underline mb-4 text-blue-600 dark:text-red-500 hover:underline"
      href="https://github.com/elianiva/elianiva.my.id/blob/master/src/routes/post{currentSlug}/index.svx"
      target="_blank"
      rel="norel noreferrer">Suggest An Edit</a
    >
    <div class="flex gap-2 justify-center">
      {#each tags as tag}
        <div
          class="py-1 px-2 bg-gray-200 dark:bg-gray-800 text-slate-800 dark:text-slate-200 rounded-md font-heading font-medium"
        >
          # {tag}
        </div>
      {/each}
    </div>
  {/if}
  <main
    class="font-sans mx-auto text-base text-left prose prose-custom dark:prose-invert dark:prose-custom-invert"
    bind:this={contentContainer}
  >
    <slot />
    {#if !minimal}
      <h1>Comments</h1>
      {#if $theme === Theme.DARK}
        <div>
          <script {...getCommentOptions(true)}></script>
        </div>
      {:else}
        <div>
          <script {...getCommentOptions(false)}></script>
        </div>
      {/if}
    {/if}
  </main>
</section>
<Progress />

<script>
import { onMount } from "svelte";
import { page } from "$app/stores";
import SEO from "$lib/components/SEO.svelte";
import Progress from "$lib/components/Progress.svelte";
import { Theme, theme } from "$lib/store/theme";

export let title = "";
export let date = Date.now();
export let desc = "";
export let tags = [];
export let minimal = false;

const currentSlug = $page.url.pathname;

let contentContainer;
onMount(() => {
  contentContainer
    .querySelectorAll("h1 a, h2 a, h3 a")
    .forEach((/** @type {HTMLAnchorElement} */ link) => {
      // use `decodeURIComponent` to handle Japanese characters
      if (
        !link.hash ||
        !contentContainer.querySelectorAll(decodeURIComponent(link.hash)).length
      ) {
        return;
      }

      link.addEventListener("click", (/** @type {MouseEvent} */ e) => {
        e.preventDefault();
        window.location.hash = /** @type {HTMLAnchorElement} */ (
          e.target
        ).getAttribute("href");
      });
    });
});

const getCommentOptions = (/** @type {boolean} */ isDark) => ({
  src: "https://utteranc.es/client.js",
  repo: "elianiva/elianiva.my.id",
  "issue-term": "pathname",
  label: "Comments",
  theme: `${isDark ? "dark-blue" : "github-light"}`,
  crossorigin: "anonymous",
  async: true,
});
</script>
