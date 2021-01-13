<style>
.post {
  max-width: 1080px;
  padding: 1rem;
  margin: 0 auto;
  color: var(--color-main-text);
  text-align: center;
}

.post__title {
  font-family: "Overpass", sans-serif;
  font-size: 2.5rem;
  margin-top: 2rem;
  text-transform: uppercase;
  max-width: 30ch;
  margin: 0 auto;
}

.post__date {
  font-family: "Overpass", sans-serif;
  display: block;
  text-align: center;
  font-size: 1.125rem;
  line-height: 2em;
  color: var(--color-alt-text);
}

.post__edit {
  position: relative;
  font-family: "Overpass", sans-serif;
  text-align: center;
  font-size: 1.125rem;
  line-height: 2em;
  color: var(--color-main-accent);
  transition: color ease-out 0.2s;
  text-decoration: none;
}

.post__edit:hover {
  color: var(--color-main-text);
}

.post__edit:hover::before {
  transform: scale3d(1, 1, 1);
}

.post__content {
  font-family: "Open Sans", sans-serif;
  max-width: 70ch;
  margin: 0 auto;
  font-size: 1.125rem;
  text-align: left;
}

.post__content :global(p) {
  line-height: 1.75em;
  font-size: 1.125rem;
}

:global(.post__content > * + *) {
  margin-top: 1rem;
}

.post__content :global(h1) {
  position: relative;
  font-family: "Overpass", sans-serif;
  font-size: 2rem;
  line-height: 1.75em;
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
  position: relative;
  font-family: "Overpass", sans-serif;
  line-height: 1.5em;
  font-size: 1.625rem;
  padding-left: 1.5rem;
}

.post__content :global(h3) {
  position: relative;
  font-family: "Overpass", sans-serif;
  font-size: 1.5rem;
  line-height: 2em;
  padding-left: 0.5rem;
  padding-left: 1.5rem;
}

.post__content :global(h3::after) {
  content: "• ";
  position: absolute;
  left: 0;
  color: var(--color-main-accent);
}

.post__content :global(h2::after) {
  content: "# ";
  position: absolute;
  left: 0;
  color: var(--color-main-accent);
}

.post__content :global(img) {
  width: 100%;
}

.post__content :global(pre) {
  border-radius: 0.5rem;
  scrollbar-color: var(--color-thin) var(--color-special-bg);
  border: 0.125rem var(--color-borders) solid;
}

.post__content :global(pre::-webkit-scrollbar-thumb) {
  background-color: var(--color-thin);
}

.post__content :global(pre::-webkit-scrollbar) {
  background-color: var(--color-special-bg);
  height: 0.5rem;
}

.post__content :global(a) {
  font-weight: 600;
  position: relative;
  display: inline-block;
  color: var(--color-main-accent);
  text-decoration: none;
  transition: all ease-out 0.2s;
  z-index: 5;
}

.post__content :global(a::before) {
  position: absolute;
  content: "";
  bottom: 0.25rem;
  left: -0.25rem;
  right: -0.25rem;
  top: 0.25rem;
  transform: scale3d(0, 0.1, 1);
  transform-origin: 0 100%;
  background-image: linear-gradient(
    to right,
    var(--color-main-accent),
    rgba(0, 0, 0, 0)
  );
  z-index: -1;
  transition: transform ease-out 0.2s;
}

.post__content :global(a:hover::before) {
  transform: scale3d(1, 0.1, 1);
}

.post__content :global(code) {
  font-family: "JetBrains Mono", monospace;
  color: var(--color-main-accent);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 1rem;
  background-color: var(--color-alt-bg);
  box-shadow: 0 0 0.25em rgba(0, 0, 0, 0.1);
}

.post__content :global(pre code) {
  font-family: "JetBrains Mono", monospace;
  font-weight: 400;
  padding: 0;
  border-radius: 0;
  background: none;
  box-shadow: none;
  color: #e4e4e4;
}

.post__content :global(ul) {
  list-style: none;
}

.post__content :global(ul li) {
  position: relative;
  font-size: 1.125rem;
  line-height: 1.75em;
  padding-left: 1rem;
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
  font-size: 1.125rem;
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

.post__content :global(blockquote p) {
  font-size: 1.125rem;
  letter-spacing: 0.02em;
  color: var(--color-thin);
  font-style: italic;
  font-family: serif;
  margin: 1rem 0;
}

.post__content :global(blockquote p::before) {
  content: "“	";
}

.post__content :global(blockquote p::after) {
  content: " ”";
}

:global(:target:before) {
  content: "";
  display: block;
  height: 4.5rem;
  margin-top: -4.5rem;
}

.post__content :global(h1 a),
.post__content :global(h2 a),
.post__content :global(h3 a) {
  color: var(--color-main-text);
}

.post__content :global(del),
.post__content :global(del *) {
  color: var(--color-alt-text) !important;
  font-style: italic;
  text-decoration: line-through;
}

.post__content :global(h1 a::before),
.post__content :global(h2 a::before),
.post__content :global(h3 a::before){
  display: none;
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
  font-family: "Overpass", sans-serif;
  font-weight: 500;
}

.post__tag::before {
  content: "# ";
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
}
</style>

<svelte:head>
  <link
    rel="preload"
    href="/prism-night-owl.css"
    as="style"
    onload="this.rel='stylesheet'"
  />
</svelte:head>

<SEO {desc} {title} />

<section class="post">
  <h1 class="post__title">{title}</h1>
  <span class="post__date">
    Posted on
    {dayjs(date).format('dddd')},
    {dayjs(date).format('DD MMMM YYYY')}
  </span>
  <a
    class="post__edit"
    href="https://github.com/elianiva/elianiva.me/blob/master/src/pages/post/{currentPost.slug}/index.svx"
    target="_blank"
    rel="norel noreferrer"
  >Suggest An Edit</a>
  <div class="post__tags">
    {#each tags as tag}
      <div class="post__tag">{tag}</div>
    {/each}
  </div>
  <main class="post__content" bind:this={content}>
    <slot />
  </main>
</section>
<ProgressButton />

<script>
import { onMount } from "svelte"
import SEO from "@/components/SEO.svelte"
import ProgressButton from "@/components/ProgressButton.svelte"
import dayjs from "dayjs"
import data from "@/site-data"
export let title, date, desc, tags

let content
// eslint-disable-next-line
const posts = __POSTS__
const currentPost = posts.filter(post => post.title === title)[0]

onMount(() => {
  content.querySelectorAll("a").forEach(a => {
    // if the link doesn't have # href or id matching the # href then do nothing
    if (
      !a.hash ||
      // use `decodeURIComponent` to handle Japanese characters
      !content.querySelectorAll(decodeURIComponent(a.hash)).length
    ) {
      return
    }

    a.addEventListener("click", event => {
      event.preventDefault()
      window.location.hash = event.target.getAttribute("href")
    })
  })
})
</script>
