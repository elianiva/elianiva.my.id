<style lang="scss">
.card {
  overflow: hidden;
  box-shadow: 0 0.25rem 0.75rem rgba($color: #000000, $alpha: 0.1);
  border-radius: 0.25rem;
  text-align: left;
  background-color: #ffffff;

  &__details {
    color: #121212;
    text-decoration: none;
    padding: 1rem;
    display: grid;
    grid-template-rows: 2rem 3.5rem 1fr;
    border-top: 0.125rem rgba($color: #ff4851, $alpha: 0.1) solid;
    transition: all ease-out 0.2s;

    &:hover {
      color: #ff4851;
    }
  }

  &__title {
    font-family: "Roboto Condensed", sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.75rem;
  }

  &__desc {
    line-height: 1.5rem;
    color: #696969;
  }

  &__date {
    font-family: "Roboto Condensed", sans-serif;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #696969;
  }
}

:global(.card__icon) {
  width: 1.125rem;
  height: 1.125rem;
}
</style>

<div class="card">
  <Image src={src} ratio="50%" />
  <a href={href} class="card__details">
    <span class="card__date">
      <Calendar class="card__icon" />
      {dayjs(date).format('DD MMMM YYYY')}
    </span>
    <span class="card__title">{title}</span>
    <p class="card__desc">{desc}</p>
  </a>
</div>

<script>
import Calendar from "../../icons/calendar.svg"
import Image from "svelte-image"
import dayjs from "dayjs"
export let title, src, desc, href, date
</script>
