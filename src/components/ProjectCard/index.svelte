<style lang="scss">
.card {
  overflow: hidden;
  box-shadow: 0 0.25rem 0.75rem rgba($color: #000000, $alpha: 0.1);
  border-radius: 0.25rem;
  text-align: left;
  background-color: #ffffff;

  &__details {
    padding: 1rem;
    display: grid;
    grid-template-rows: 2rem 3.5rem 1fr;
    border-top: 0.125rem rgba($color: #ff4851, $alpha: 0.1) solid;
  }

  &__title {
    text-decoration: none;
    color: #121212;
    font-family: "Roboto Condensed", sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.75rem;
    transition: all ease-out 0.2s;

    &:hover {
      color: #ff4851;
    }
  }

  &__desc {
    line-height: 1.5rem;
    color: #696969;
  }

  &__links {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  &__demo,
  &__source {
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    transition: filter ease-out 0.2s;

    &:hover {
      filter: brightness(0.95);
    }
  }

  &__demo {
    background-color: #ff4851;
    color: #ffffff;
    box-shadow: 0 0.25rem 0.5rem rgba($color: #ff4851, $alpha: 0.4);
  }

  &__source {
    background-color: #efefef;
    color: #696969;
  }
}

:global(.card__icon) {
  width: 1.125rem;
  height: 1.125rem;
}
</style>

<div class="card">
  <Image class="card__image" src={src} ratio="50%" />
  <div class="card__details">
    <a href={href} class="card__title">{title}</a>
    <p class="card__desc">{desc}</p>
    <div class="card__links">
      <a
        class="card__demo"
        href={demo}
        target="_blank"
        rel="norel noreferrer"
      ><Chrome class="card__icon" />Demo</a>
      <a
        class="card__source"
        href={source}
        target="_blank"
        rel="norel noreferrer"
      ><Code class="card__icon" />Source</a>
    </div>
  </div>
</div>

<script>
import Code from "../../icons/code.svg"
import Chrome from "../../icons/chrome.svg"
import Image from "svelte-image"
import dayjs from "dayjs"
export let title, src, desc, href, demo, source
</script>
