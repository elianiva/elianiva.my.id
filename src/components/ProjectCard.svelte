<style>
.card {
  overflow: hidden;
  border: 0.0625rem #e4e4e4 solid;
  border-radius: 0.25rem;
  text-align: left;
  background-color: #ffffff;
}

.card__img {
  position: relative;
  display: block;
  width: 100%;
  z-index: 2;
}

.card__details {
  padding: 1rem;
  display: grid;
  grid-template-rows: 2rem 4.5rem 1fr;
  border-top: 0.0625rem #e4e4e4 solid;
}

.card__title {
  text-decoration: none;
  color: #121212;
  font-family: "Roboto Condensed", sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.75rem;
  transition: all ease-out 0.2s;
}

.card__title:hover {
  color: #ff4851;
}

.card__desc {
  font-family: "Roboto", sans-serif;
  line-height: 1.5rem;
  color: #696969;
}

.card__links {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.card__demo,
.card__source {
  font-family: "Roboto", sans-serif;
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
  filter: brightness(0.95);
}

.card__demo {
  background-color: #ff4851;
  color: #ffffff;
  box-shadow: 0 0.25rem 0.5rem rgba(255, 72, 81, 0.25);
}

.card__source {
  background-color: #efefef;
  color: #696969;
}

:global(.card__icon) {
  width: 1.125rem;
  height: 1.125rem;
}
</style>

<div class="card">
  <Waypoint throttle="500" offset="320"><img class="card__img" src={src} alt={title} /></Waypoint>
  <div class="card__details">
    <a rel="prefetch" href={href} class="card__title">{title}</a>
    <p class="card__desc">{desc}</p>
    <div class="card__links">
      {#if demo}
        <a
          class="card__demo"
          href={demo ? demo : '#'}
          target="_blank"
          rel="norel noreferrer"
        ><Chrome class="card__icon" />Demo</a>
      {/if}
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
import Code from "../icons/code.svg"
import Chrome from "../icons/chrome.svg"
import Waypoint from "svelte-waypoint"
export let title, src, desc, href, demo, source
</script>
