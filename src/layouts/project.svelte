<style>
  .project {
    max-width: 1080px;
    display: flex;
    margin: 2rem auto;
    padding: 0 1rem;
    gap: 1rem;
  }

  .project__left {
    width: 70%;
  }

  .project__wrapper {
    border-radius: 0.5rem;
    overflow: hidden;
    border: 0.0625rem var(--color-special-bg) solid;
    height: 24.5rem;
    margin-bottom: 2rem;
  }

  .project__img {
    width: 100%;
  }

  .project__header {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
  }

  .project__title {
    color: var(--color-main-text);
    font-family: "Overpass", sans-serif;
    font-size: 2rem;
  }

  .project__demo,
  .project__source {
    font-family: "Inter", sans-serif;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    transition: filter ease-out 0.2s;
  }

  .project__demo:hover,
  .project__source:hover {
    filter: brightness(1.2);
  }
  .project__demo {
    background-color: var(--color-main-accent);
    color: #ffffff;
  }
  .project__source {
    background-color: var(--color-special-bg);
    color: var(--color-alt-text);
  }
  :global(.project__icon) {
    width: 1.125rem;
    height: 1.125rem;
  }
  .project__divider {
    border: none;
    height: 0.125rem;
    margin: 0.5rem 0 1rem;
    background-color: var(--color-special-bg);
  }

  .project__content {
    font-family: "Inter", sans-serif;
    font-size: 1.125rem;
    line-height: 1.75rem;
  }

  .project__stack {
    width: 30%;
    height: 100%;
    padding: 1rem;
    border: 0.0625rem var(--color-borders) solid;
    border-radius: 0.5rem;
  }

  .stack__title {
    color: var(--color-main-text);
    font-family: "Overpass", sans-serif;
    font-weight: 600;
    font-size: 1.5rem;
  }

  .stack__divider {
    height: 0.125rem;
    border: none;
    background-color: var(--color-border);
    margin: 0.5rem 0;
  }

  .stack__item {
    display: grid;
    grid-template-columns: 3.5rem 1fr;
    gap: 1rem;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 0.0625rem var(--color-border) solid;
  }

  .stack__item:last-child {
    border: none;
  }

  .stack__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background-color: var(--color-special-bg);
  }

  .stack__logo img {
    width: 100%;
  }

  .stack__name {
    color: var(--color-main-text);
    font-family: "Overpass", sans-serif;
    font-size: 1.25rem;
    text-decoration: none;
    transition: color ease-out 0.2s;
  }

  .stack__name:hover {
    color: var(--color-main-accent);
  }

  .stack__name::after {
    content: "↗";
    font-size: 1rem;
    vertical-align: top;
  }

  :global(.project__content p) {
    color: var(--color-main-text);
    margin-bottom: 1rem;
  }

  :global(.project__content p a) {
    position: relative;
    display: inline-block;
    color: var(--color-main-accent);
    text-decoration: none;
    margin: 0 0.125rem;
    transition: all ease-out 0.2s;
  }

  :global(.project__content p a:hover) {
    color: var(--color-main-text);
  }

  :global(.project__content p a::before) {
    position: absolute;
    content: "";
    bottom: 0;
    left: -0.25rem;
    right: -0.25rem;
    top: 0;
    transform: scale3d(0, 0.1, 0);
    background-color: rgba(255, 72, 81, 0.5);
    z-index: -1;
    transition: all ease-out 0.2s;
    transform-origin: bottom;
  }

  :global(.project__content a:hover::before) {
    transform: scale3d(0, 1, 0);
  }

  :global(.project__content code) {
    background-color: var(--color-special-bg);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
  }

  :global(.project__content pre) {
    border-radius: 0.5rem;
    margin: 0.5rem 0;
    scrollbar-color: var(--color-thin) var(--color-special-bg);
  }

  :global(.project__content pre::-webkit-scrollbar-thumb) {
    background-color: var(--color-thin);
  }

  :global(.project__content pre::-webkit-scrollbar) {
    background-color: var(--color-special-bg);
    height: 0.5rem;
  }

  :global(.project__content pre code) {
    padding: 0;
    border-radius: 0;
    font-size: 1rem;
  }

  @media only screen and (max-width: 480px) {
    :global(.project__content pre) {
      margin-left: -1rem !important;
      margin-right: -1rem !important;
      border-radius: 0;
    }
  }
</style>

<svelte:head>
  {#if $theme === 'light'}
    <link
      rel="preload"
      href="/prism-gruvbox-hard.css"
      as="style"
      onload="this.rel='stylesheet'"
    />
  {:else}
    <link
      rel="preload"
      href="/prism-night-owl.css"
      as="style"
      onload="this.rel='stylesheet'"
    />
  {/if}
</svelte:head>

<SEO {title} thumbnail={`${data.siteUrl}/project/${slug}/cover.png`} />

<section class="project">
  <main class="project__left">
    <div class="project__wrapper">
      <Waypoint throttle="500" offset="320">
        <img
          src={`/project/${slug}/cover.png`}
          alt={title}
          class="project__img"
          loading="lazy"
        />
      </Waypoint>
    </div>
    <div class="project__content">
      <div class="project__header">
        <h1 class="project__title">{title}</h1>
        <a
          class="project__demo"
          href={demo ? demo : '#'}
          target="_blank"
          rel="norel noreferrer"
        ><Chrome class="project__icon" />Demo</a>
        <a
          class="project__source"
          href={source}
          target="_blank"
          rel="norel noreferrer"
        ><Code class="card__icon" />Source</a>
      </div>
      <hr class="project__divider" />
      <slot />
    </div>
  </main>
  <div class="project__stack">
    <span class="stack__title">Tech Stack</span>
    <hr class="stack__divider" />
    {#each stack as item}
      <div class="stack__item">
        <div class="stack__logo">
          <img src="/logo/{item[0].toLowerCase()}.png" alt={item} />
        </div>
        <a
          href={item[1]}
          class="stack__name"
          target="_blank"
          rel="norel noreferrer"
        >{item[0]}</a>
      </div>
    {/each}
  </div>
</section>
<ProgressButton />

<script>
  import SEO from "@/components/SEO.svelte"
  import Chrome from "@/icons/chrome.svg"
  import Code from "@/icons/code.svg"
  import Waypoint from "svelte-waypoint"
  import ProgressButton from "@/components/ProgressButton.svelte"
  import { theme } from "@/utils/theme"
  import data from "@/site-data"
  export let title

  const projects = __PROJECTS__
  const currentProject = projects.filter(project => project.title === title)[0]

  const { slug, stack, demo, source } = currentProject
</script>
