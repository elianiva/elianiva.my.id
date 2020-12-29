<style>
.navbar {
  height: 4rem;
  border-bottom: 0.0625rem var(--color-borders) solid;
  z-index: 20;
  background-color: var(--color-alt-bg);
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
}

.navbar .active a {
  color: var(--color-shine);
}

.navbar__container {
  height: 100%;
  display: flex;
  align-items: center;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 1rem;
}

.navbar__title {
  flex: 1;
}

.navbar__title a {
  font-family: "Kaushan Script", cursive;
  font-size: 1.5rem;
  font-weight: 400;
  text-decoration: none;
  color: var(--color-main-text);
  transition: color ease-out 0.2s;
}

.navbar__title a:hover {
  color: var(--color-main-accent);
}

.navbar__items {
  list-style: none;
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-items: center;
}

.navbar__item {
  padding-top: 0.25rem;
}

.navbar__item a {
  font-family: "Overpass", sans-serif;
  font-size: 1.125rem;
  line-height: 1.5em;
  position: relative;
  color: var(--color-alt-text);
  text-decoration: none;
  transition: color ease-out 0.2s;
}

.navbar__item a:hover {
  color: var(--color-shine);
}

.navbar__item a:hover::after {
  transform: scale(1);
}

.navbar__item a::after {
  content: "";
  position: absolute;
  bottom: -0.25rem;
  left: 0;
  right: 0;
  height: 0.125rem;
  background-color: var(--color-main-accent);
  transform: scale(0);
  transition: transform ease-out 0.2s;
}

.navbar__hamburger {
  display: none;
  cursor: pointer;
}

.navbar__checkbox {
  opacity: 0;
}

.navbar__button {
  border: none;
  background: none;
  outline: none;
  display: flex;
  align-items: center;
  color: var(--color-main-text);
  cursor: pointer;
}

@media only screen and (max-width: 480px) {
  .navbar__items {
    display: none;
  }

  .navbar__hamburger {
    position: relative;
    z-index: 10;
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    gap: 0.25rem;
    width: 1.5rem;
    height: 0.85rem;
  }

  .navbar__checkbox {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 2;
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
    background-color: var(--color-main-text);
    transition: transform ease-out 0.2s;
  }

  .navbar__mobile {
    position: fixed;
    z-index: 20;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-alt-bg);
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
    font-family: "Overpass", sans-serif;
    text-decoration: none;
    font-size: 1.5rem;
    color: var(--color-main-text);
  }
}
</style>

<nav class="navbar">
  <div class="navbar__container">
    <div class="navbar__title"><a href="/">Elianiva</a></div>
    <ul class="navbar__items">
      <li class="navbar__item"><a href="/">Home</a></li>
      <li class="navbar__item" class:active={segment === 'post'}>
        <a href="/post">Posts</a>
      </li>
      <li class="navbar__item" class:active={segment === 'project'}>
        <a href="/project">Projects</a>
      </li>
      <li class="navbar__item" class:active={segment === 'about'}>
        <a href="/about">About</a>
      </li>
      <li class="navbar__item">
        <button
          class="navbar__button"
          on:click={toggleDarkMode}
          aria-label="toggle darkmode"
        >
          <Moon class="navbar__darkmode" width="1.5rem" height="1.5rem" />
        </button>
      </li>
    </ul>
    <div class="navbar__hamburger" transition:fade={{ duration: 200 }}>
      <input
        class="navbar__checkbox"
        on:input={toggleNav}
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
  <div class="navbar__mobile" transition:fly={{ duration: 200, y: -100 }}>
    <ul class="navbar__mobile_items">
      <li class="navbar__mobile_item" on:click={toggleNav}>
        <a href="/">Home</a>
      </li>
      <li class="navbar__mobile_item" class:active={segment === 'post'}>
        <a href="/post" on:click={toggleNav}>Posts</a>
      </li>
      <li class="navbar__mobile_item" class:active={segment === 'project'}>
        <a href="/project" on:click={toggleNav}>Projects</a>
      </li>
      <li class="navbar__mobile_item" class:active={segment === 'about'}>
        <a href="/about" on:click={toggleNav}>About</a>
      </li>
      <li class="navbar__mobile_item">
        <button
          class="navbar__button"
          on:click={toggleDarkMode}
          aria-label="toggle darkmode"
        >
          <Moon class="navbar__darkmode" width="1.5rem" height="1.5rem" />
        </button>
      </li>
    </ul>
  </div>
{/if}

<script>
import { fly, fade } from "svelte/transition"
import Moon from "@/icons/moon.svg"
import { theme } from "@/utils/theme"
export let segment

let isVisible = false
let checked = false

const toggleDarkMode = () => {
  theme.update(current => (current === "light" ? "dark" : "light"))
}

const toggleNav = () => {
  checked = !checked
  isVisible = !isVisible

  // turn off scrolling when mobile nav is visible
  if (checked) document.body.style.overflow = "hidden"
  else document.body.style.overflow = "auto"
}
</script>
