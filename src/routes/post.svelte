<SEO title="Posts" />

<section class="max-w-[1080px] mx-auto pt-8 px-4 text-center">
  <h1
    class="font-heading relative inline-block text-3xl font-semibold text-slate-700 dark:text-slate-200 mb-10 before:(content-[] absolute -bottom-1 left-8 right-8 h-1 rounded-sm bg-blue-600 dark:bg-red-500)"
  >
    All Posts
  </h1>
  <div class="relative">
    <input
      class="block mx-auto my-0 w-full p-3 text-lg border-none rounded-md shadow-md bg-white dark:bg-gray-800 outline-none font-sans text-slate-600 dark:text-slate-400 placeholder:text-slate-400 placeholder:dark:text-slate-600"
      id="posts__input"
      type="text"
      placeholder="Find post... (start with # to find tags)"
      autocomplete="off"
      aria-label="search post"
      on:input={filterPost}
      bind:this={inputBox}
    />
    {#if isCompletionVisible}
      <div
        transition:fly={{ duration: 100, y: -50 }}
        class="absolute top-16 left-0 right-0 z-[5] rounded-md text-slate-600 dark:text-slate-400 bg-white dark:bg-gray-800 p-2 shadow-md"
      >
        {#each [...new Set(tags)] as tag}
          {#if tag.match(new RegExp(tagKeyword.substring(1)))}
            <span
              class="block text-left font-heading text-lg p-2 text-slate-600 dark:text-slate-400 cursor-pointer rounded-md transition-property-all ease-out duration-50 hover:(text-slate-700 dark:text-slate-300 bg-gray-50 dark:bg-gray-700)"
              on:click={() => {
                tagFilter = [...tagFilter, tag]; // cant use push here
                inputBox.value = "";
                tagKeyword = "";
                isCompletionVisible = false;
              }}
            >
              {tag} • {count[tag]} result{count[tag] > 1 ? "s" : ""}
            </span>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
  {#if tagFilter.length > 0}
    <div
      class="flex items-center gap-4 mt-4 text-slate-700 dark:text-slate-300"
    >
      {#each tagFilter as filter}
        <Tag
          label={filter}
          onClick={() => {
            tagFilter = tagFilter.filter((x) => x !== filter);
          }}
        />
      {/each}
    </div>
  {/if}
  <div class="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-5 mt-4">
    {#each filteredPosts as post}
      <PostCard
        title={post.title}
        href={`/post/${post.slug}`}
        desc={post.desc}
        date={post.date}
        tags={post.tags}
      />
    {/each}
  </div>
</section>
<Progress />

<script lang="ts">
import type { ResourceMetadata } from "$lib/utils/fetch-data";
import { fly } from "svelte/transition";
import SEO from "$lib/components/SEO.svelte";
import PostCard from "$lib/components/PostCard.svelte";
import Progress from "$lib/components/Progress.svelte";
import Tag from "$lib/components/Tag.svelte";

export let posts: ResourceMetadata[];

let inputBox = null;
let keyword = "";
let tagKeyword = "";
let filteredPosts = [];
let tagFilter = [];
let isCompletionVisible = false;

// count available tags and insert it to an object
// ex: [a, a, b, b, b] -> { a: 2, b: 3 }
const tags = posts.map((post) => post.tags).flat();
const count = tags.reduce(
  (acc, curr) => ({ ...acc, [curr]: (acc[curr] || 0) + 1 }),
  {}
);

$: filteredPosts = posts.filter((post) => {
  const query = keyword.substr(1).toLowerCase();

  const title = post.title.toLowerCase().includes(query);
  const slug = post.slug.toLowerCase().includes(query);
  const tags = tagFilter.every((x) => post.tags.includes(x));
  return (title || slug) && tags;
});

function filterPost({ currentTarget: { value } }) {
  // always reset the completion visibility
  isCompletionVisible = false;

  if (!value.match(/^#/)) {
    keyword = value;
    return;
  }

  tagKeyword = value;
  isCompletionVisible = true;
}
</script>
