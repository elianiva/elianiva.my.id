<style>
.posts {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1rem 0;
  text-align: center;
}

.posts__title {
  font-family: "Overpass", sans-serif;
  position: relative;
  display: inline-block;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--color-main-text);
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

.posts__input {
  display: block;
  margin: 0 auto 1.5rem;
  width: 100%;
  padding: 0.75rem;
  font-size: 1.125rem;
  border: none;
  background-color: var(--color-special-bg);
  border-radius: 0.25rem;
  outline: none;
  color: var(--color-main-text);
}

.posts__input::placeholder {
  color: var(--color-alt-text);
}

.posts__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1.25rem;
}
</style>

<SEO title="Posts" />

<section class="posts">
  <h1 class="posts__title">All Posts</h1>
  <input
    class="posts__input"
    id="posts__input"
    type="text"
    placeholder="Search for post..."
    aria-label="search post"
  />
  <div class="posts__cards">
    {#each posts as post}
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
<ProgressButton showBar={false} />

<script>
import SEO from "@/components/SEO.svelte"
import PostCard from "@/components/PostCard.svelte"
import ProgressButton from "@/components/ProgressButton.svelte"

// eslint-disable-next-line
const posts = __POSTS__
</script>
