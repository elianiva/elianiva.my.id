<style>
.card {
  overflow: hidden;
  text-align: left;
  background-color: var(--color-alt-bg);
  z-index: 2;
  border-radius: 0.25rem;
  box-shadow: var(--card-shadow);
}

.card__details {
  color: var(--color-main-text);
  text-decoration: none;
  padding: 1rem;
  display: grid;
  grid-template-rows: 3.5rem 2rem 5.5rem 1fr;
}

.card__title {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.5em;
  text-transform: capitalize;
  color: var(--color-main-text);
  transition: color ease-out 0.1s;
}

.card__desc {
  font-family: var(--font-sans);
  line-height: 1.5em;
  color: var(--color-alt-text);
  margin-top: 0.25rem;
  padding-top: 0.5rem;
}

.card__date {
  font-family: var(--font-heading);
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
  font-family: var(--font-heading);
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

.card__tag::before {
  content: "# ";
  font-weight: 600;
}

@media only screen and (min-width: 480px) {
  .card__details:hover .card__title {
    color: var(--color-shine);
  }
}
</style>

<div class="card" in:fade={{ duration: 200 }}>
  <a rel="prefetch" {href} class="card__details">
    <span class="card__title">{title}</span>
    <div class="card__date">
      <CalendarIcon className="date__icon" />
      <span class="date__label">
        {new Date(date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </span>
    </div>
    <p class="card__desc">{@html desc}</p>
    <div class="card__tags">
      {#each tags as tag}
        <span class="card__tag">{tag}</span>
      {/each}
    </div>
  </a>
</div>

<script lang="ts">
import { fade } from "svelte/transition";
import CalendarIcon from "~icons/ph/calendar-blank-bold";

export let title: string;
export let desc: string;
export let href: string;
export let date: string;
export let tags: Array<string>;
</script>
