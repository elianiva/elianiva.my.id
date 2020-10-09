<style lang="scss">
.card {
  overflow: hidden;
  box-shadow: 0 0.25rem 0.75rem rgba($color: #000000, $alpha: 0.1);
  border-radius: 0.25rem;
  color: #121212;
  text-decoration: none;
  text-align: left;
  background-color: #ffffff;
  transition: all ease-out 0.2s;

  &:hover {
    transform: translateY(-0.25rem);
    color: #ff4851;
  }

  &__details {
    padding: 1rem;
    display: grid;
    grid-template-rows: 3.5rem 1fr;
    border-top: 0.125rem rgba($color: #ff4851, $alpha: 0.1) solid;
  }

  &__title {
    font-family: "Roboto Condensed", sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
  }

  &__desc {
    line-height: 1.5rem;
    color: #696969;
  }
}
</style>

<a href={href} class="card">
  <Image class="card__image" src={src} ratio="50%" />
  <div class="card__details">
    <span class="card__title">{title}</span>
    <p class="card__desc">{desc}</p>
  </div>
</a>

<script>
import Image from "svelte-image"
export let title, src, desc, href
</script>
