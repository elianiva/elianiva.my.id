<style>
.navbar {
  height: 4rem;
  border-bottom: 0.125rem #eaeaea solid;
  position: fixed;
  z-index: 20;
  left: 0;
  right: 0;
  background-color: #ffffff;
}
.navbar .active a {
  color: #ff4851;
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
  color: #121212;
  transition: color ease-out 0.2s;
}
.navbar__title a:hover {
  color: #ff4851;
}
.navbar__items {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: center;
  justify-items: center;
  gap: 0.75rem;
  font-family: "Roboto Condensed", sans-serif;
  font-size: 1.25rem;
}
.navbar__item a {
  position: relative;
  color: #121212;
  text-decoration: none;
  transition: color ease-out 0.2s;
}
.navbar__item a:hover {
  color: #ff4851;
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
  background-color: #ff4851;
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
    background-color: #121212;
    transition: transform ease-out 0.2s;
  }
  .navbar__mobile {
    position: fixed;
    z-index: 5;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .navbar__mobile_items {
    display: grid;
    grid-template-rows: repeat(4, 1fr);
    align-items: center;
    justify-items: center;
    gap: 2rem;
    list-style: none;
  }
  .navbar__mobile_item a {
    font-family: "Roboto Condensed", sans-serif;
    text-decoration: none;
    font-size: 1.5rem;
    color: #121212;
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
    </ul>
    <div class="navbar__hamburger">
      <input
        bind:this={checkbox}
        on:click={() => (isVisible = !isVisible)}
        type="checkbox"
      />
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
      </ul>
    </div>
  {/if}
</nav>

<script>
import { fly } from "svelte/transition"
export let segment

let checkbox

const toggleNav = () => {
  checkbox.checked = !checkbox.checked
  isVisible = !isVisible
}

let isVisible = false
</script>
