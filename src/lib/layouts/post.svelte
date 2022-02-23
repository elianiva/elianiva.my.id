<style>
.post__content :global(p) {
  @apply leading-relaxed text-base mb-5;
}

.post__content :global(h1),
.post__content :global(h2),
.post__content :global(h3) {
  @apply relative font-heading mt-10 mb-2;
}

.post__content :global(h1 + h2) {
  @apply mt-6 mb-2;
}

.post__content :global(h1) {
  @apply m-6 leading-relaxed tracking-wider;
}

.post__content :global(h1::after) {
  content: "";
  @apply absolute left-0 right-0 bottom-0 h-[0.125rem];
  background-image: linear-gradient(
    to right,
    var(--color-main-accent),
    rgba(0, 0, 0, 0)
  );
}

.post__content :global(h2) {
  @apply leading-relaxed text-xl tracking-wider;
}

.post__content :global(h3) {
  @apply text-lg leading-loose pl-6 tracking-wider;
}

.post__content :global(h3::after) {
  content: "• ";
  @apply absolute left-0;
  color: var(--color-main-accent);
}

.post__content :global(img) {
  @apply w-full;
}

.post__content :global(pre) {
  @apply p-4 mt-5 overflow-x-auto;
  scrollbar-color: var(--color-thin) var(--color-special-bg);
  border: 0.0625rem var(--color-borders) solid;
  background-color: var(--color-alt-bg);
}

.post__content :global(pre::-webkit-scrollbar) {
  background-color: var(--color-alt-bg);
  @apply h-2;
}

.post__content :global(pre:hover::-webkit-scrollbar) {
  background-color: var(--color-special-bg);
  @apply cursor-pointer;
}

.post__content :global(pre::-webkit-scrollbar-thumb) {
  background-color: var(--color-alt-bg);
  @apply cursor-pointer;
}

.post__content :global(pre:hover::-webkit-scrollbar-thumb) {
  background-color: var(--color-thin);
}

.post__content :global(p > a),
.post__content :global(ul a) {
  @apply relative inline-block no-underline z-[1];
  color: var(--color-shine);
}

.post__content :global(p > a::after),
.post__content :global(ul a::after) {
  content: "";
  @apply absolute bottom-1 left-0 right-0 transform-gpu scale-0 h-[2px] -z-[1];
  background-color: var(--color-main-accent);
}

.post__content :global(p > a:hover::after),
.post__content :global(ul a:hover::after) {
  @apply transform-gpu scale-100 transition-[transform] ease-out duration-200;
}

.post__content :global(a:hover) {
  text-decoration-color: var(--color-main-accent);
}

.post__content :global(code) {
  @apply font-monospace py-[0.125rem] px-1 rounded-md text-base;
  border: 0.0625rem var(--color-borders) solid;
  background-color: var(--color-alt-bg);
}

.post__content :global(pre code) {
  @apply font-monospace font-normal text-sm p-0 border-none rounded-none bg-none shadow-none;
}

.post__content :global(ul) {
  @apply list-inside mb-5;
}

.post__content :global(:not(li) ul) {
  @apply m-0;
}

.post__content :global(#table-of-contents + ul) {
  @apply mb-6;
}

.post__content :global(#table-of-contents + ul li p) {
  @apply inline font-normal;
}

.post__content :global(ul li) {
  @apply relative font-normal leading-loose pl-4 break-words;
  /* white-space: pre-wrap; */
}

.post__content :global(li p:first-child) {
  @apply inline-block;
  color: var(--color-shine);
}

.post__content :global(li p:not(:first-child)) {
  @apply font-sans text-[1.05rem] leading-relaxed pl-6;
  color: var(--color-main-text);
}

.post__content :global(ul li > ul *) {
  @apply text-base;
}

.post__content :global(table) {
  @apply w-full rounded-md overflow-hidden;
}

.post__content :global(table a) {
  color: var(--color-shine);
  @apply transition-[all] duration-200 ease-out font-semibold leading-relaxed italic;
}

.post__content :global(table tr:nth-child(odd)) {
  background-color: var(--color-special-bg);
}

.post__content :global(table th) {
  background-color: var(--color-main-accent);
  color: var(--color-alt-bg);
  @apply text-xl;
}

.post__content :global(table th),
.post__content :global(table td) {
  @apply py-3 px-4;
}

.post__content :global(blockquote) {
  border-left: 0.25rem var(--color-thin) solid;
  padding-left: 0.5rem;
}

.post__content :global(blockquote p) {
  font-size: 1rem;
  letter-spacing: 0.02em;
  color: var(--color-alt-text);
  margin: 1rem 0;
}

.post__content :global(h1 a),
.post__content :global(h2 a),
.post__content :global(h3 a) {
  color: var(--color-shine);
  @apply no-underline;
}

.post__content :global(del),
.post__content :global(del *) {
  color: var(--color-alt-text) !important;
  @apply italic line-through;
}

.post__content :global(h1 a::before),
.post__content :global(h2 a::before),
.post__content :global(h3 a::before) {
  @apply hidden;
}

@media only screen and (max-width: 480px) {
  :global(.post__content pre) {
    margin-left: -1rem !important;
    margin-right: -1rem !important;
    border: none;
    border-radius: 0;
  }

  :global(.post__content ul *) {
    font-size: 0.95rem !important;
  }

  :global(.post__content p) {
    font-size: 1rem;
  }

  .post__content :global(pre::-webkit-scrollbar) {
    height: 0;
  }
}
</style>

<SEO {desc} {title} />

<section
  class="max-w-screen-lg py-4 px-8 mx-auto text-center text-slate-600 dark:text-slate-400"
>
  {#if !minimal}
    <h1
      class="font-heading text-[2.5rem] uppercase max-w-[30ch] mt-12 mx-auto mb-0 font-semibold text-slate-800 dark:text-slate-200"
    >
      {title}
    </h1>
    <span
      class="font-heading block text-center text-lg leading-loose text-slate-500 dark:text-slate-600"
    >
      Posted on
      {new Date(date).toLocaleDateString("en-Gb", { weekday: "long" })},
      {new Date(date).toLocaleDateString("en-GB", {
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
    class="font-sans max-w-[70ch] mx-auto text-base text-left prose prose-slate"
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

import "../../prism-night-owl.css";

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
