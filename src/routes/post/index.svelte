<style>
.posts {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1rem 0;
  text-align: center;
}

.posts__title {
  font-family: var(--font-heading);
  position: relative;
  display: inline-block;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-shine);
  margin-bottom: 2.5rem;
}

.posts__title::before {
  content: "";
  position: absolute;
  bottom: -0.25rem;
  height: 0.25rem;
  left: 2rem;
  right: 2rem;
  border-radius: 0.25rem;
  background-color: var(--color-main-accent);
}

.post__input {
  position: relative;
}

.input__box {
  display: block;
  margin: 0 auto 0;
  width: 100%;
  padding: 0.75rem;
  font-size: 1.125rem;
  border: none;
  background-color: var(--color-alt-bg);
  border: 0.0625rem var(--color-borders) solid;
  outline: none;
  font-family: var(--font-sans);
  color: var(--color-main-text);
}

.input__box::placeholder {
  color: var(--color-alt-text);
}

.posts__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 1.25rem;
  margin-top: 1rem;
}

.input__autocomplete {
  position: absolute;
  top: calc(4rem - 1px); /* 1px = border thickness */
  left: 0;
  right: 0;
  z-index: 5;
  background-color: var(--color-alt-bg);
  border: 0.0625rem var(--color-borders) solid;
  color: var(--color-main-text);
  padding: 0.5rem;
  box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.1);
}

.autocomplete__item {
  display: block;
  text-align: left;
  font-family: var(--font-heading);
  font-size: 1.125rem;
  padding: 0.5rem;
  color: var(--color-alt-text);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all ease-out 0.05s;
}

.autocomplete__item:hover {
  backdrop-filter: var(--filter-brightness);
  color: var(--color-shine);
}

.posts__tags {
  display: flex;
  justify-items: center;
  gap: 1rem;
  margin-top: 1rem;
  color: var(--color-shine);
}
</style>

<SEO title="Posts" />

<section class="posts">
  <h1 class="posts__title">All Posts</h1>
  <div class="post__input">
    <input
      class="input__box"
      id="posts__input"
      type="text"
      placeholder="Find post... (start with # to find tags)"
      aria-label="search post"
      on:input={filterPost}
      bind:this={inputBox}
    />
    {#if isCompletionVisible}
      <div
        transition:fly={{ duration: 100, y: -50 }}
        class="input__autocomplete"
      >
        {#each [...new Set(tags)] as tag}
          {#if tag.match(new RegExp(tagKeyword.substr(1)))}
            <!-- prettier-ignore -->
            <span
              class="autocomplete__item"
              on:click={() => {
                tagFilter = [...tagFilter, tag] // cant use push here
                inputBox.value = ""
                tagKeyword = ""
                isCompletionVisible = false
              }}
            >
              {tag} • {count[tag]} result{count[tag] > 1 ? 's' : ''}
            </span>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
  {#if tagFilter.length > 0}
    <div class="posts__tags">
      {#each tagFilter as filter}
        <Tag
          label={filter}
          onClick={() => {
            tagFilter = tagFilter.filter(x => x !== filter);
          }}
        />
      {/each}
    </div>
  {/if}
  <div class="posts__cards">
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

<script context="module">
export const prerender = true;
export async function load({ fetch }) {
  const posts = await (await fetch(`/api/post.json`)).json();
  return { props: { posts } };
}
</script>

<script lang="ts">
import type { Metadata } from "$lib/utils/fetch-data";
import { fly } from "svelte/transition";
import SEO from "$lib/components/SEO.svelte";
import PostCard from "$lib/components/PostCard.svelte";
import Progress from "$lib/components/Progress.svelte";
import Tag from "$lib/components/Tag.svelte";

export let posts: Metadata[];

let inputBox = null;
let keyword = "";
let tagKeyword = "";
let filteredPosts = [];
let tagFilter = [];
let isCompletionVisible = false;

// count available tags and insert it to an object
// ex: [a, a, b, b, b] -> { a: 2, b: 3 }
const tags = posts.map(post => post.tags).flat();
const count = tags.reduce(
  (acc, curr) => ({ ...acc, [curr]: (acc[curr] || 0) + 1 }),
  {}
);

$: filteredPosts = posts.filter(post => {
  const query = keyword.substr(1).toLowerCase();

  const title = post.title.toLowerCase().includes(query);
  const slug = post.slug.toLowerCase().includes(query);
  const tags = tagFilter.every(x => post.tags.includes(x));
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
