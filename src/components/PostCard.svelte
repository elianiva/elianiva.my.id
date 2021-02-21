<style>
.card {
  overflow: hidden;
  border: 0.0625rem var(--color-borders) solid;
  text-align: left;
  background-color: var(--color-alt-bg);
  z-index: 2;
}

.card__details {
  color: var(--color-main-text);
  text-decoration: none;
  padding: 1rem;
  display: grid;
  grid-template-rows: 3.5rem 2rem 5.5rem 1fr;
}

.card__title {
  font-family: "Overpass", sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.5em;
  text-transform: capitalize;
  transition: all ease-out 0.1s;
}

.card__desc {
  border-top: 0.0625rem var(--color-borders) solid;
  font-family: "Open Sans", sans-serif;
  line-height: 1.5em;
  color: var(--color-alt-text);
  margin-top: 0.25rem;
  padding-top: 0.5rem;
}

.card__date {
  font-family: "Overpass", sans-serif;
  display: flex;
  gap: 0.4rem;
  align-items: center;
  justify-self: start;
  font-size: 0.8rem;
  color: var(--color-alt-text);
}

.card__date :global(.date__icon) {
  width: 1rem;
  height: 1rem;
  display: block;
  margin-top: -0.25rem;
}

.card__tags {
  display: flex;
  gap: 0.5rem;
}

.card__tag {
  background-color: var(--color-special-bg);
  font-family: "Overpass", sans-serif;
  font-weight: 600;
  color: var(--color-main-text);
  font-size: 0.8rem;
  text-decoration: none;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  margin-top: 0.5rem;
  border-radius: 0.25rem;
  transition: filter ease-out 0.2s;
  text-transform: capitalize;
}

.card__tag:hover {
  filter: brightness(1.2);
}

.card__tag::before {
  content: "# ";
  font-weight: 600;
}

@media only screen and (min-width: 480px) {
  .card__details:hover .card__title{
    color: var(--color-main-accent);
  }
}
</style>

<div class="card" in:fade={{ duration: 200 }}>
  <a rel="prefetch" {href} class="card__details">
    <span class="card__title">{title}</span>
    <div class="card__date">
      <Calendar class="date__icon" />
      <span class="date__label">{dayjs(date).format("DD MMMM YYYY")}</span>
    </div>
    <p class="card__desc">{desc}</p>
    <div class="card__tags">
      {#each tags as tag}<span class="card__tag">{tag}</span>{/each}
    </div>
  </a>
</div>

<script>
import { fade } from "svelte/transition"
import Calendar from "@/icons/calendar.svg"
import dayjs from "dayjs"
export let title, desc, href, date, tags
</script>
