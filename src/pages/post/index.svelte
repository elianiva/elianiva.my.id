<style>
.posts {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1rem 0;
  text-align: center;
}
.posts__title {
  font-family: "PT Sans", sans-serif;
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
.posts__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1.25rem;
}
</style>


<div class="posts">
  <h1 class="posts__title">All Posts</h1>
  <div class="posts__cards">
  {#each posts as post}
    <PostCard
      title={post.title}
      src={`/post/${post.slug}/cover.png`}
      href={`/post/${post.slug}`}
      desc="aaaaaaaaaaaaaaaaaaa"
      date={post.date}
    />
  {/each}
  </div>
</div>

<script>
import Image from "svelte-image"
import PostCard from "../../components/PostCard.svelte"
const posts = __POSTS__
</script>
