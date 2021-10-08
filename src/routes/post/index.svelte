<style>
.posts {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1rem 0;
  text-align: center;
}

.posts__title {
  font-family: "Rubik", sans-serif;
  position: relative;
  display: inline-block;
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-main-text);
  margin-bottom: 1rem;
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
  margin: 0 auto 1rem;
  width: 100%;
  padding: 0.75rem;
  font-size: 1.125rem;
  border: none;
  background-color: var(--color-alt-bg);
  border: 0.0625rem var(--color-borders) solid;
  outline: none;
  font-family: "Inter", sans-serif;
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
  top: 4rem;
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
  font-family: "Rubik", sans-serif;
  font-size: 1.125rem;
  padding: 0.5rem;
  color: var(--color-alt-text);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all ease-out 0.05s;
}

.autocomplete__item:hover {
  backdrop-filter: brightness(1.5);
  color: var(--color-main-text);
}

.posts__tags {
  display: flex;
  justify-items: center;
  gap: 1rem;
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
                tagFilter = [...tagFilter, tag]
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
  <div class="posts__tags">
    {#each tagFilter as filter}
      <Tag
        label={filter}
        onClick={() => (tagFilter = tagFilter.filter(x => x !== filter))}
      />
    {/each}
  </div>
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
<ProgressButton />

<script context="module">
export const prerender = true;
export async function load({ fetch }) {
  const posts = await (await fetch(`/api/post.json`)).json();
  return { props: { posts } };
}
</script>

<script lang="ts">
import { fly } from "svelte/transition";
import SEO from "$lib/components/SEO.svelte";
import PostCard from "$lib/components/PostCard.svelte";
import ProgressButton from "$lib/components/ProgressButton.svelte";
import Tag from "$lib/components/Tag.svelte";

// eslint-disable-next-line
export let posts: Array<any>;
let inputBox = null;
let keyword = "";
let tagKeyword = "";
let filteredPosts = [];
let tagFilter = [];
let isCompletionVisible = false;

// count available tags and insert it to an object, ex: `{a: 2, b: 3}`
const tags = posts.map(post => post.tags).flat();
let count = {};
for (const x of tags) {
  count[x] = (count[x] || 0) + 1;
}

$: filteredPosts = posts.filter(post => {
  const query = keyword.substr(1).toLowerCase();

  const title = post.title.toLowerCase().includes(query);
  const slug = post.slug.toLowerCase().includes(query);
  const tags =
    tagFilter.length > 0 ? tagFilter.every(x => post.tags.includes(x)) : true;
  return (title || slug) && tags;
});

const filterPost: any = ({ target: { value } }) => {
  // always reset the completion visibility
  isCompletionVisible = false;

  if (!value.match(/^#/)) {
    keyword = value;
    return;
  }

  tagKeyword = value;
  isCompletionVisible = true;
};
</script>
