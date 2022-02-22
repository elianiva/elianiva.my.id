<style>
.navbar__item {
  @apply pt-1;
}

.navbar__item a::after {
  content: "";
  @apply absolute -bottom-1 left-0 right-0 h-[0.125rem];
  background-color: var(--color-main-accent);
  transform: scale3d(0, 0, 0);
  transition: transform ease-out 0.2s;
}

.navbar__item a:hover::after {
  transform: scale3d(1, 1, 1);
}

.navbar__hamburger {
  @apply hidden cursor-pointer;
}

.navbar__checkbox {
  @apply opacity-0;
}

@media only screen and (max-width: 480px) {
  .navbar__items {
    display: none;
  }

  .navbar__hamburger {
    position: relative;
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    gap: 0.25rem;
    width: 1.5rem;
    height: 0.85rem;
  }

  .navbar__checkbox {
    position: absolute;
    min-width: 1.5rem;
    min-height: 1.5rem;
    z-index: 50;
  }

  .navbar__checkbox:checked ~ .navbar__hamburger_item--1 {
    transform: rotate(45deg) translate3d(0, 0.5rem, 0);
  }

  .navbar__checkbox:checked ~ .navbar__hamburger_item--2 {
    transform: scale(0);
  }

  .navbar__checkbox:checked ~ .navbar__hamburger_item--3 {
    transform: rotate(-45deg) translate3d(0, -0.5rem, 0);
  }

  [class^="navbar__hamburger_item"] {
    position: relative;
    display: block;
    background-color: var(--color-shine);
    transition: transform ease-out 0.2s;
  }

  .navbar__mobile {
    position: fixed;
    z-index: 20;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-main-bg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .navbar__mobile_items {
    display: grid;
    grid-template-rows: repeat(5, 1fr);
    align-items: center;
    justify-items: center;
    gap: 2rem;
    list-style: none;
  }

  .navbar__mobile_item a {
    font-family: var(--font-heading);
    text-decoration: none;
    font-size: 1.5rem;
    color: var(--color-main-text);
  }
}
</style>

<nav
  class="fixed w-[6rem] h-full top-0 left-0 bg-gray-100 dark:bg-gray-900 z-30 border-r border-gray-300 dark:border-gray-800 py-8"
>
  <div
    class="h-full flex flex-col items-center justify-center max-w-screen-lg mx-auto px-4"
  >
    <ul class="list-none flex flex-col gap-8 items-center justify-center">
      {#each routes as r}
        <li class="navbar__item" data-testid="home">
          <a
            class="relative hover:text-slate-700 hover:dark:text-slate-300 text-lg leading-relaxed no-underline font-sans transition-[color_0.1s_ease-out] {r.path ===
            segment
              ? 'text-slate-700 dark:text-slate-300'
              : 'text-slate-400 dark:text-slate-600'}"
            href={r.path}
          >
            <svelte:component this={r.icon} width="2rem" height="2rem" />
          </a>
        </li>
      {/each}
      <li class="navbar__item">
        <Moon />
      </li>
    </ul>
    <div
      class="navbar__hamburger"
      transition:fade={{ duration: 200 }}
      data-testid="hamburger-navigation"
    >
      <input
        class="navbar__checkbox"
        on:input|stopPropagation={toggleNav}
        type="checkbox"
        {checked}
        aria-label="toggle menu"
      />
      <span class="navbar__hamburger_item--1" />
      <span class="navbar__hamburger_item--2" />
      <span class="navbar__hamburger_item--3" />
    </div>
  </div>
</nav>
{#if isVisible}
  <div
    class="navbar__mobile"
    transition:fly={{ duration: 200, y: -100 }}
    data-testid="mobile-nav"
  >
    <ul class="navbar__mobile_items">
      <li class="navbar__mobile_item" on:click={toggleNav}>
        <a href="/">Home</a>
      </li>
      <li class="navbar__mobile_item" class:active={segment === "post"}>
        <a href="/post" on:click={toggleNav}>Posts</a>
      </li>
      <li class="navbar__mobile_item" class:active={segment === "project"}>
        <a href="/project" on:click={toggleNav}>Projects</a>
      </li>
      <li class="navbar__mobile_item" class:active={segment === "about"}>
        <a href="/about" on:click={toggleNav}>About</a>
      </li>
      <li class="navbar__mobile_item">
        <Moon />
      </li>
    </ul>
  </div>
{/if}

<script lang="ts">
import { fly, fade } from "svelte/transition";
import Moon from "$lib/components/Moon.svelte";
import HomeIcon from "~icons/ph/house-fill";
import PostIcon from "~icons/ph/newspaper-fill";
import AboutIcon from "~icons/ph/user-circle-fill";
import ProjectIcon from "~icons/ph/browser-fill";

export let segment: string;

let isVisible = false;
let checked = false;

const toggleNav = () => {
  checked = !checked;
  isVisible = !isVisible;

  // turn off scrolling when mobile nav is visible
  if (checked) document.body.style.overflow = "hidden";
  else document.body.style.overflow = "auto";
};

const routes = [
  { path: "/", icon: HomeIcon },
  { path: "/post", icon: PostIcon },
  { path: "/project", icon: ProjectIcon },
  { path: "/about", icon: AboutIcon },
];
</script>
