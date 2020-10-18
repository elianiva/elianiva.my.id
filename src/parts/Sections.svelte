<style>
.section {
  position: relative;
  padding: 0 1rem;
  margin-top: 4rem;
  font-family: "PT Sans", sans-serif;
  color: #121212;
  text-align: center;
}
.section::after {
  position: absolute;
  content: "";
  bottom: 3rem;
  right: 0;
  width: 4rem;
  height: 4rem;
  background-color: rgba(255, 72, 81, 0.075);
  z-index: -1;
}
.section__title {
  position: relative;
  display: inline-block;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
}
.section__title::before {
  content: "";
  position: absolute;
  bottom: -0.25rem;
  height: 0.25rem;
  left: 2rem;
  right: 2rem;
  border-radius: 0.25rem;
  background-color: #ff4851;
}
.section__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1.25rem;
}
.section__button {
  display: inline-block;
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  color: #ffffff;
  background-color: #ff4851;
  text-decoration: none;
  font-family: "Roboto Condensed", sans-serif;
  font-size: 1.25rem;
  border-radius: 0.25rem;
  box-shadow: 0 0.25rem 1rem rgba(255, 72, 81, 0.25);
  transition: all ease-out 0.2s;
}
.section__button:hover {
  transform: translateY(-0.25rem);
  filter: brightness(0.95);
}
:global(.section__pattern) {
  color: #ff4851;
  position: absolute;
  top: 0;
  left: -2rem;
  width: 14rem;
  height: 10rem;
}
</style>

<section class="section">
  <Pattern class="section__pattern" />
  <h1 class="section__title">{title}</h1>
  <div class="section__cards">
    {#if type === 'posts'}
      {#each data as item}
        <PostCard
          title={item.title}
          src={`/post/${item.slug}/cover.png`}
          href={`/post/${item.slug}`}
          desc={item.desc}
          date={item.date}
          tags={item.tags}
        />
      {/each}
    {:else}
      {#each data as item}
        <ProjectCard
          title={item.title}
          src={`/project/${item.slug}/cover.png`}
          href={`/project/${item.slug}`}
          desc={item.desc}
          demo={item.demo}
          source={item.source}
        />
      {/each}
    {/if}
  </div>
  <a href={url} class="section__button">{btnText}</a>
</section>

<script>
import Pattern from "../icons/pattern.svg"
import PostCard from "../components/PostCard.svelte"
import ProjectCard from "../components/ProjectCard.svelte"
export let title, data, btnText, url, type
</script>
