<style lang="scss">
.card {
  display: grid;
  grid-template-columns: 2fr 3fr;
  grid-column-gap: 1rem;
  grid-auto-flow: dense;
  text-align: left;
  margin: 0 0 4rem;

  &__img {
    grid-column: 1/2;
    border-radius: 0.25rem;
    overflow: hidden;
    box-shadow: 0 0.5rem 0.5rem rgba($color: #000000, $alpha: 0.05);
  }

  &__content {
    grid-column: 2/3;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    justify-content: center;
  }

  &__title {
    position: relative;
    font-family: "Roboto Condensed", sans-serif;
    font-size: 2rem;
    color: #121212;
    text-decoration: none;
    font-weight: 600;
    transition: color ease-out 0.2s;
    display: flex;
    align-items: center;

    &:hover {
      color: #ff4851;
    }

    &::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: 0;
      width: 2rem;
      height: 0.25rem;
      background-color: #ff4851;
    }
  }

  &__stars {
    font-size: 1.125rem;
    color: #121212;
    display: inline-flex;
    gap: 0.25rem;
    align-items: center;
  }

  &__source {
    font-family: "Roboto Condensed", sans-serif;
    font-size: 1.25rem;
    color: #121212;
    text-decoration: none;
  }

  &__desc {
    font-family: "Roboto Condensed", sans-serif;
    font-size: 1.25rem;
    color: #121212;
    text-decoration: none;
  }

  &__source {
    margin-top: 0.5rem;
  }

  &__author,
  &__repo {
    padding: 0.25rem 0.5rem;
    background-color: #efefef;
    border-radius: 0.25rem;
    color: #121212;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  &:nth-child(even) {
    grid-template-columns: 3fr 2fr;
    .card {
      &__img {
        grid-column: 2/3;
      }
      &__content {
        grid-column: 1/2;
      }
    }
  }
}

:global(.img__thumb) {
  display: block;
}

@media only screen and (max-width: 960px) {
  .card {
    grid-template-columns: 1fr;
    &__img {
      grid-column: 1/2;
    }
    &__content {
      grid-column: 1/2;
      margin-top: 1rem;;
    }

    &:nth-child(even) {
      grid-template-columns: 1fr;
      .card {
        &__img {
          grid-column: 1/2;
        }
        &__content {
          grid-column: 1/2;
        }
      }
    }
  }
}

.thing {
}
</style>

<div class="card">
  <div class="card__img">
    <Image class="card__thumb" ratio="50%" src={img} />
  </div>
  <div class="card__content">
    <a
      class="card__title"
      href={website}
      target="_blank"
      rel="norel noreferrer"
    >{name}
      <span class="card__stars">
        <Star color="#ff4851" />{stars}
      </span></a>
    <div class="card__source">
      <a
        class="card__author"
        href={url}
        target="_blank"
        rel="norel noreferrer"
      ><User class="card__icon" />{author}</a>
      <a
        class="card__repo"
        href={repo}
        target="_blank"
        rel="norel noreferrer"
      ><Github class="card__icon" />Repository</a>
    </div>
    <span class="card__desc">{desc}</span>
  </div>
</div>

<script>
import {onMount} from "svelte"
import User from "../../icons/user.svg"
import Star from "../../icons/star.svg"
import Github from "../../icons/github.svg"
import Image from "svelte-image"
export let name, author, url, repo, img, website, desc

let stars = ""

const format = num => (num > 1000 ? `${(num / 1000).toFixed(1)}k` : num)

onMount(async () => {
  const data = await fetch(
    `https://api.github.com/repos/${url.split("/").pop()}/${name.toLowerCase()}`
  )
  const parsed = await data.json()
  stars = format(parsed.stargazers_count)
})
</script>
