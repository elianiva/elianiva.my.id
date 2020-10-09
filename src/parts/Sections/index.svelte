<style lang="scss">
.section {
  position: relative;
  padding: 0 1rem;
  margin-top: 4rem;
  font-family: "PT Sans", sans-serif;
  color: #121212;
  text-align: center;

  &__title {
    position: relative;
    display: inline-block;
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 2rem;

    &::before {
      content: "";
      position: absolute;
      bottom: -0.25rem;
      height: 0.25rem;
      left: 2rem;
      right: 2rem;
      border-radius: 0.25rem;
      background-color: #ff4851;
    }
  }

  &__cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: 1.25rem;
  }

  &__button {
    display: inline-block;
    margin-top: 2rem;
    padding: 0.75rem 1.5rem;
    color: #ffffff;
    background-color: #ff4851;
    text-decoration: none;
    font-family: "Roboto Condensed", sans-serif;
    font-size: 1.25rem;
    border-radius: 0.25rem;
    box-shadow: 0 0.25rem 1rem rgba($color: #ff4851, $alpha: 0.25);
    transition: all ease-out 0.2s;

    &:hover {
      transform: translateY(-0.25rem);
      filter: brightness(0.95);
    }
  }

  &::after {
    position: absolute;
    content: "";
    bottom: 3rem;
    right: 0;
    width: 4rem;
    height: 4rem;
    background-color: rgba($color: #ff4851, $alpha: 0.075);
    z-index: -1;
  }
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
    {#each data as item}
      <Card
        title={item.title}
        src={item.cover}
        desc={item.desc}
        href={item.url}
        date={item.date}
      />
    {/each}
  </div>
  <a href={url} class="section__button">{btnText}</a>
</section>

<script>
import Pattern from "./pattern.svg"
import Card from "../../components/Card/index.svelte"
export let title, data, btnText, url
</script>
