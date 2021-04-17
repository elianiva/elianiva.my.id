<style>
.card {
  overflow: hidden;
  border: 0.0625rem var(--color-borders) solid;
  text-align: left;
  background-color: var(--color-alt-bg);
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
  border-top: 0.0625rem var(--color-borders) solid;
}

.card__title {
  text-decoration: none;
  color: var(--color-main-text);
  font-family: "Overpass", sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.5em;
  transition: all ease-out 0.2s;
}

.card__title:hover {
  color: var(--color-main-accent);
}

.card__desc {
  font-family: "Open Sans", sans-serif;
  line-height: 1.5em;
  color: var(--color-alt-text);
}

.card__links {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.card__demo,
.card__source {
  font-family: "Overpass", sans-serif;
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
  filter: brightness(1.2);
}

.card__demo {
  background-color: var(--color-main-accent);
  color: #f4f4f4;
}

.card__source {
  background-color: var(--color-special-bg);
  color: var(--color-alt-text);
}

:global(.card__icon) {
  width: 1.125rem;
  height: 1.125rem;
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
  <svelte:component this={Waypoint} throttle="500" offset="320">
    <img class="card__img" src={imgSrc} alt={title} loading="lazy" />
  </svelte:component>
  <div class="card__details">
    <a rel="prefetch" {href} class="card__title">{title}</a>
    <p class="card__desc">{desc}</p>
    <div class="card__links">
      {#if demo}
        <a
          class="card__demo"
          href={demo ? demo : "#"}
          target="_blank"
          rel="norel noreferrer"><Chrome className="card__icon" />Demo</a
        >
      {/if}
      <a
        class="card__source"
        href={source}
        target="_blank"
        rel="norel noreferrer"><Code className="card__icon" />Source</a
      >
    </div>
  </div>
</div>

<script lang="ts">
import { fade } from "svelte/transition"
import Code from "$lib/icons/Code.svelte"
import Chrome from "$lib/icons/Chrome.svelte"
import { onMount } from "svelte"

let Waypoint: any // this doesn't have TS declaration so..
onMount(async () => {
  const module = await import("svelte-waypoint")
  Waypoint = module.default
})

export let title: string
export let imgSrc: string
export let desc: string
export let href: string
export let demo: string
export let source: string
</script>
