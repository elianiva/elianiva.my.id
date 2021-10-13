<style>
.post {
  max-width: 1080px;
  padding: 1rem 2rem;
  margin: 0 auto;
  color: var(--color-main-text);
  text-align: center;
}

.post__title {
  font-family: "Rubik", sans-serif;
  font-size: 2.5rem;
  text-transform: uppercase;
  max-width: 30ch;
  margin: 3rem auto 0;
}

.post__date {
  font-family: "Rubik", sans-serif;
  display: block;
  text-align: center;
  font-size: 1.125rem;
  line-height: 2em;
  color: var(--color-alt-text);
}

.post__edit {
  position: relative;
  display: block;
  font-family: "Rubik", sans-serif;
  text-align: center;
  font-size: 1.125rem;
  line-height: 2em;
  color: var(--color-main-accent);
  text-decoration: none;
  margin-bottom: 1rem;
}

.post__edit:hover {
  text-decoration: underline;
}

.post__edit:hover::before {
  transform: scale3d(1, 1, 1);
}

.post__tags {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.post__tag {
  padding: 0.25rem 0.5rem;
  background-color: var(--color-special-bg);
  color: var(--color-main-text);
  border-radius: 0.25rem;
  font-family: "Rubik", sans-serif;
  font-weight: 500;
}

.post__tag::before {
  content: "# ";
}

.post__content {
  font-family: "Inter", sans-serif;
  max-width: 70ch;
  margin: 0 auto;
  font-size: 1rem;
  text-align: left;
}

.post__content :global(p) {
  line-height: 1.75em;
  font-size: 1rem;
  margin: 0 0 1.25rem;
}

.post__content :global(h1),
.post__content :global(h2),
.post__content :global(h3) {
  position: relative;
  font-family: "Rubik", sans-serif;
  margin: 2.5rem 0 0.5rem;
}

.post__content :global(h1 + h2) {
  margin: 1.5rem 0 0.5rem;
}

.post__content :global(h1) {
  font-size: 1.75rem;
  line-height: 1.75em;
  letter-spacing: 0.05em;
}

.post__content :global(h1::after) {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0.125rem;
  background-image: linear-gradient(
    to right,
    var(--color-main-accent),
    rgba(0, 0, 0, 0)
  );
}

.post__content :global(h2) {
  font-size: 1.25rem;
  line-height: 1.5em;
  font-size: 1.625rem;
  letter-spacing: 0.05em;
}

.post__content :global(h3) {
  font-size: 1.125rem;
  line-height: 2em;
  padding-left: 1.5rem;
  letter-spacing: 0.05em;
}

.post__content :global(h3::after) {
  content: "• ";
  position: absolute;
  left: 0;
  color: var(--color-main-accent);
}

.post__content :global(img) {
  width: 100%;
}

.post__content :global(pre) {
  padding: 1rem;
  scrollbar-color: var(--color-thin) var(--color-special-bg);
  border: 0.0625rem var(--color-borders) solid;
  margin: 1.25rem 0;
  overflow-x: auto;
  background-color: var(--color-alt-bg);
}

.post__content :global(pre::-webkit-scrollbar) {
  background-color: var(--color-alt-bg);
  height: 0.5rem;
}

.post__content :global(pre:hover::-webkit-scrollbar) {
  background-color: var(--color-special-bg);
  cursor: pointer;
}

.post__content :global(pre::-webkit-scrollbar-thumb) {
  background-color: var(--color-alt-bg);
  cursor: pointer;
}

.post__content :global(pre:hover::-webkit-scrollbar-thumb) {
  background-color: var(--color-thin);
}

.post__content :global(p > a),
.post__content :global(ul a) {
  position: relative;
  display: inline-block;
  color: var(--color-main-text);
  z-index: 5;
  text-decoration: none;
  z-index: 1;
}

.post__content :global(p > a:hover),
.post__content :global(ul a:hover) {
  color: var(--color-main-accent);
}

.post__content :global(p > a::after),
.post__content :global(ul a::after) {
  content: "";
  position: absolute;
  background-color: var(--color-main-accent);
  bottom: 0.25rem;
  left: 0;
  right: 0;
  height: 2px;
  z-index: -1;
}

.post__content :global(a:hover) {
  text-decoration-color: var(--color-main-accent);
}

.post__content :global(code) {
  font-family: "JetBrains Mono", monospace;
  color: var(--color-main-accent);
  padding: 0.125rem 0.25rem;
  border: 0.0625rem var(--color-borders) solid;
  border-radius: 0.25rem;
  font-size: 1rem;
  background-color: var(--color-alt-bg);
}

.post__content :global(pre code) {
  font-family: "JetBrains Mono", monospace;
  font-weight: 400;
  font-size: 0.9rem;
  padding: 0;
  border: none;
  border-radius: 0;
  background: none;
  box-shadow: none;
  color: var(--color-main-text);
}

.post__content :global(ul) {
  list-style: none;
  margin: 0 0 1.25rem;
}

.post__content :global(:not(li) ul) {
  margin: 0;
}

.post__content :global(#table-of-content + ul) {
  margin: 0 0 1.5rem;
}

.post__content :global(ul li) {
  position: relative;
  font-size: 1rem;
  line-height: 1.75em;
  padding-left: 1rem;
  /* white-space: pre-wrap; */
  word-wrap: break-word;
}

.post__content :global(ul li::before) {
  content: "\203A";
  color: var(--color-main-text);
  font-size: 1.5rem;
  line-height: 1.5em;
  margin-right: 0.5rem;
}

.post__content :global(ul li p) {
  display: inline-block;
  margin: 0;
}

.post__content :global(ul li > ul *) {
  font-size: 1rem;
}

.post__content :global(table) {
  width: 100%;
  border-radius: 0.2rem;
  overflow: hidden;
}

.post__content :global(table a) {
  transition: all ease-out 0.2s;
  font-weight: 600;
  line-height: 1.25em;
  font-style: italic;
}

.post__content :global(table tr:nth-child(odd)) {
  background-color: var(--color-special-bg);
}

.post__content :global(table th) {
  background-color: var(--color-main-accent);
  color: var(--color-alt-bg);
  font-size: 1.25rem;
}

.post__content :global(table th),
.post__content :global(table td) {
  padding: 0.75rem 1rem;
}

.post__content :global(blockquote) {
  border-left: 0.125rem var(--color-borders) solid;
  padding-left: 0.5rem;
}

.post__content :global(blockquote p) {
  font-size: 1rem;
  letter-spacing: 0.02em;
  color: var(--color-thin);
  margin: 1rem 0;
}

.post__content :global(h1 a),
.post__content :global(h2 a),
.post__content :global(h3 a) {
  color: var(--color-main-text);
  text-decoration: none;
}

.post__content :global(del),
.post__content :global(del *) {
  color: var(--color-alt-text) !important;
  font-style: italic;
  text-decoration: line-through;
}

.post__content :global(h1 a::before),
.post__content :global(h2 a::before),
.post__content :global(h3 a::before) {
  display: none;
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

<svelte:head>
  <link
    rel="preload"
    href="/prism-night-owl.css"
    as="style"
    on:load={function () {
      this.rel = "stylesheet";
    }}
  />
</svelte:head>

<SEO {desc} {title} />

<section class="post">
  <h1 class="post__title">{title}</h1>
  <span class="post__date">
    Posted on
    {new Date(date).toLocaleDateString("en-Gb", { weekday: "long" })},
    {new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}
  </span>
  <a
    class="post__edit"
    href="https://github.com/elianiva/elianiva.my.id/blob/master/src/routes/post{currentSlug}/index.svx"
    target="_blank"
    rel="norel noreferrer">Suggest An Edit</a
  >
  <div class="post__tags">
    {#each tags as tag}
      <div class="post__tag">{tag}</div>
    {/each}
  </div>
  <main class="post__content" bind:this={content}>
    <slot />
    <h1>Comments</h1>
    {#if $theme === "dark"}
      <div>
        <script {...getCommentOptions(true)}></script>
      </div>
    {:else}
      <div>
        <script {...getCommentOptions(false)}></script>
      </div>
    {/if}
  </main>
</section>
<ProgressButton />

<script>
// TODO(elianiva): change utterance theme to github-dark once the new version came out
import { onMount } from "svelte";
import { page } from "$app/stores";
import SEO from "$lib/components/SEO.svelte";
import ProgressButton from "$lib/components/ProgressButton.svelte";
import { theme } from "$lib/utils/theme";

export let title, date, desc, tags;

const currentSlug = $page.path;

let content;
onMount(() => {
  content.querySelectorAll("a").forEach(a => {
    // use `decodeURIComponent` to handle Japanese characters
    // prettier-ignore
    if (
      !a.hash ||
      !content.querySelectorAll(decodeURIComponent(a.hash)).length
    ) return

    a.addEventListener("click", e => {
      e.preventDefault();
      window.location.hash = e.target.getAttribute("href");
    });
  });
});

const getCommentOptions = isDark => ({
  src: "https://utteranc.es/client.js",
  repo: "elianiva/elianiva.my.id",
  "issue-term": "pathname",
  label: "Comments",
  theme: `github-${isDark ? "dark" : "light"}`,
  crossorigin: "anonymous",
  async: true,
});
</script>
