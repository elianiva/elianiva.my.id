<style>
.hero {
  position: relative;
  display: grid;
  grid-template-columns: 20rem 1fr;
  gap: 2rem;
  align-items: center;
  justify-items: center;
  color: var(--color-main-text);
  max-width: 1080px;
  margin: 0 auto;
}

.hero__greet {
  font-size: 1.25rem;
  font-family: "Overpass", sans-serif;
  font-weight: 600;
  color: var(--color-main-accent);
}

.hero__name {
  position: relative;
  display: block;
  font-family: "Overpass", sans-serif;
  font-size: clamp(1.25rem, calc(5vw + 1.25rem), 3.5rem);
  font-weight: 600;
}

.hero__role {
  font-family: "Overpass", sans-serif;
  font-size: clamp(1rem, calc(5vw + 0.5rem), 2rem);
  display: block;
}

.hero__desc {
  position: relative;
  display: block;
  color: var(--color-alt-text);
  font-family: "Open Sans", sans-serif;
  font-size: clamp(0.8rem, calc(2vw + 0.5rem), 1.125rem);
  line-height: 1.5rem;
  margin: 0 0 1rem;
}

.hero__pict {
  width: clamp(12rem, calc(20vw + 4rem), 16rem);
  height: clamp(12rem, calc(20vw + 4rem), 16rem);
  border-radius: 10rem;
  border: 0.5rem var(--color-alt-bg) solid;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
}

:global(.hero__pattern) {
  position: absolute;
  right: -2rem;
  top: -2rem;
  width: clamp(6rem, calc(10vw + 4rem), 12rem);
  height: 12rem;
  z-index: -1;
  color: var(--color-main-accent);
  opacity: 0.1;
}

.hero__right {
  position: relative;
}

.hero__right::after {
  position: absolute;
  content: "</>";
  bottom: -2rem;
  left: -2rem;
  width: 3rem;
  height: 4rem;
  font-size: 4rem;
  font-family: monospace;
  font-weight: 900;
  color: var(--color-main-accent);
  opacity: 0.1;
}
@media only screen and (max-width: 960px) {
  .hero {
    gap: 2rem;
    grid-template-columns: 1fr;
    grid-template-rows: 14rem 1fr;
    text-align: center;
    margin-top: 0;
    gap: 1rem;
  }
  :global(.hero__pattern) {
    position: absolute;
    right: 0;
    top: 0;
    height: 6rem;
    z-index: -1;
    color: rgba(255, 72, 81, 0.075);
  }
}
</style>

<section class="hero" in:fade={{ duration: 200 }}>
  <div class="hero__left">
    <a href="https://github.com/elianiva">
      <img
        class="hero__pict"
        src="https://avatars3.githubusercontent.com/u/51877647?s=240&v=4"
        alt="github profile"
      />
    </a>
  </div>
  <div class="hero__right">
    <span class="hero__greet">Hi there!</span>
    <span class="hero__name"> I'm Elianiva. </span>
    <span class="hero__role">A Frontend Developer and I love Open Source!</span>
    <p class="hero__desc">
      I'm a 17 y/o boi from Indonesia. I love making random websites and
      contribute to any open source projects that I like. I also love Anime and
      Linux related stuff, such perfect combination to lose your life eh? ツ
    </p>
    <Circle class="hero__pattern" />
  </div>
</section>

<script>
import { fade } from "svelte/transition"
import Circle from "@/icons/circle.svg"
</script>
