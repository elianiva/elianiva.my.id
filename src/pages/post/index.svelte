<style>
.posts {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1rem 0;
  text-align: center;
}
.posts__title {
  font-family: "Roboto Condensed", sans-serif;
  position: relative;
  display: inline-block;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
}
.posts__title::before {
  content: "";
  position: absolute;
  bottom: -0.25rem;
  height: 0.25rem;
  left: 2rem;
  right: 2rem;
  border-radius: 0.25rem;
  background-color: #ff4851;
}

.posts__input {
  display: block;
  margin: 0 auto 1.5rem;
  width: 100%;
  padding: 0.75rem;
  font-size: 1.125rem;
  border: none;
  background-color: #efefef;
  border-radius: 2rem;
  outline: none;
}

.posts__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1.25rem;
}
</style>

<SEO title="Posts" />

<div class="posts">
  <h1 class="posts__title">All Posts</h1>
  <label for="posts__input">
    <input
      class="posts__input"
      id="posts__input"
      type="text"
      placeholder="Search for post..."
    />
  </label>
  <div class="posts__cards">
    {#each posts as post}
      <PostCard
        title={post.title}
        src={`/post/${post.slug}/cover.png`}
        href={`/post/${post.slug}`}
        desc={post.desc}
        date={post.date}
        tags={post.tags}
      />
    {/each}
  </div>
</div>

<script>
import SEO from "../../components/SEO.svelte"
import PostCard from "../../components/PostCard.svelte"

const posts = __POSTS__
</script>
