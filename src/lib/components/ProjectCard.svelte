<style>
.card {
  overflow: hidden;
  text-align: left;
  background-color: var(--color-alt-bg);
  box-shadow: var(--card-shadow);
  border-radius: 0.25rem;
}

.card__img {
  position: relative;
  display: block;
  width: 100%;
  height: 12rem;
  object-fit: cover;
  background-color: var(--color-borders);
  z-index: 2;
}

.card__details {
  padding: 1rem;
  display: grid;
  grid-template-rows: 2rem 4.5rem 1fr;
}

.card__title {
  text-decoration: none;
  color: var(--color-main-text);
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.5em;
  transition: all ease-out 0.2s;
}

.card__title:hover {
  color: var(--color-shine);
}

.card__desc {
  font-family: var(--font-sans);
  line-height: 1.5em;
  color: var(--color-alt-text);
}

.card__links {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.card__demo,
.card__source {
  font-family: var(--font-heading);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: filter ease-out 0.2s;
}

.card__demo:hover,
.card__source:hover {
  color: var(--color-shine);
}

.card__demo {
  color: var(--color-alt-text);
}

.card__source {
  color: var(--color-alt-text);
}

.card :global(.wrapper) {
  display: block;
}

@media only screen and (min-width: 480px) {
  .card__details:hover {
    color: var(--color-main-accent);
  }
}
</style>

<div class="card" in:fade={{ duration: 200 }}>
  <img
    class="card__img"
    src={imgSrc}
    alt={title}
    loading="lazy"
    data-testid="img"
  />
  <div class="card__details">
    <a rel="prefetch" {href} class="card__title" data-testid="title">{title}</a>
    <p class="card__desc" data-testid="desc">{desc}</p>
    <div class="card__links">
      {#if demo}
        <a
          class="card__demo"
          href={demo ? demo : "#"}
          target="_blank"
          rel="norel noreferrer"
          data-testid="demo"
        >
          <GlobeIcon /> Visit
        </a>
      {/if}
      <a
        class="card__source"
        href={source}
        target="_blank"
        rel="norel noreferrer"
        data-testid="source"
      >
        <GithubIcon /> Source
      </a>
    </div>
  </div>
</div>

<script lang="ts">
import { fade } from "svelte/transition";
import GlobeIcon from "~icons/ph/globe";
import GithubIcon from "~icons/fe/github";

export let title: string;
export let imgSrc: string;
export let desc: string;
export let href: string;
export let demo: string;
export let source: string;
</script>
