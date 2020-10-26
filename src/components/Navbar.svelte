<style>
.navbar {
  height: 4rem;
  border-bottom: 0.0625rem var(--color-borders) solid;
  z-index: 20;
  background-color: var(--color-alt-bg);
}

.navbar .active a {
  color: var(--color-main-accent);
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
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  justify-items: center;
  gap: 0.75rem;
  font-family: "Roboto Condensed", sans-serif;
  font-size: 1.25rem;
}

.navbar__item a {
  position: relative;
  color: var(--color-main-text);
  text-decoration: none;
  transition: color ease-out 0.2s;
}

.navbar__item a:hover {
  color: var(--color-main-accent);
}

.navbar__item a:hover::before {
  transform: scale(1);
}

.navbar__item a::before {
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

.navbar__hamburger input {
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

  .navbar__hamburger input {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 2;
  }

  .navbar__hamburger input:checked ~ span:nth-child(3) {
    transform: scale(0);
  }

  .navbar__hamburger input:checked ~ span:nth-child(2) {
    transform: rotate(45deg) translateY(0.5rem);
  }

  .navbar__hamburger input:checked ~ span:nth-child(4) {
    transform: rotate(-45deg) translateY(-0.5rem);
  }

  .navbar__hamburger_item {
    position: relative;
    display: block;
    background-color: var(--color-main-text);
    transition: transform ease-out 0.2s;
  }

  .navbar__mobile {
    position: fixed;
    z-index: 5;
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
    font-family: "Roboto Condensed", sans-serif;
    text-decoration: none;
    font-size: 1.5rem;
    color: var(--color-main-text);
  }
}
</style>

<svelte:window bind:innerHeight={screenHeight} bind:scrollY={scrollPos} />
<nav class="navbar" style={navPosition}>
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
        <button class="navbar__button" on:click={toggleDarkMode}>
          <Moon class="navbar__darkmode" width="1.5rem" height="1.5rem" />
        </button>
      </li>
    </ul>
    <div class="navbar__hamburger">
      <input bind:this={checkbox} on:click={toggleDarkMode} type="checkbox" />
      <span class="navbar__hamburger_item" />
      <span class="navbar__hamburger_item" />
      <span class="navbar__hamburger_item" />
    </div>
  </div>
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
            on:click={() => darkTheme.update(current => !current)}
          >
            <Moon class="navbar__darkmode" width="1.5rem" height="1.5rem" />
          </button>
        </li>
      </ul>
    </div>
  {/if}
</nav>

<script>
import { fly } from "svelte/transition"
import Moon from "@/icons/moon.svg"
import { darkTheme } from "@/utils/theme"
export let segment, position

let screenHeight, scrollPos, navPosition, checkbox
let isVisible = false

$: navPosition = getNavbarPosition(scrollPos)

const getNavbarPosition = scrollPos => {
  if (position === "home") {
    return `
    position: ${scrollPos >= screenHeight ? "fixed" : "absolute"};
    left: 0;
    right: 0;
    top: ${scrollPos >= screenHeight ? "100vh" : "unset"};
    transform: ${scrollPos >= screenHeight ? "translateY(-100vh)" : "unset"};
    `
  } else {
    return `
    position: fixed;
    left: 0;
    right: 0;
    `
  }
}

const toggleDarkMode = () => {
  darkTheme.update(current => {
    return current === "light" ? "dark" : "light"
  })
}

const toggleNav = () => {
  checkbox.checked = !checkbox.checked
  isVisible = !isVisible
}
</script>
