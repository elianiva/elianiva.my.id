<style lang="scss">
.hero {
  position: relative;
  display: grid;
  grid-template-columns: 20rem 1fr;
  gap: 2rem;
  align-items: center;
  justify-items: center;
  color: #121212;

  &__name {
    position: relative;
    font-family: "PT Sans", sans-serif;
    display: block;
    font-size: clamp(1.25rem, calc(5vw + 1rem), 3rem);
    font-weight: 600;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      bottom: 0;
      width: 6rem;
      height: 0.25rem;
      border-radius: 0.125rem;
      background-color: #ff4851;
      display: none;
    }
  }

  &__desc {
    position: relative;
    display: block;
    color: #696969;
    font-family: "Roboto Condensed", sans-serif;
    font-size: 1.25rem;
    line-height: 2rem;
    margin: 1rem 0;
  }

  &__pict {
    width: clamp(14rem, calc(20vw + 4rem), 16rem);
    height: clamp(14rem, calc(20vw + 4rem), 16rem);
    border-radius: 10rem;
    border: 0.5rem #ffffff solid;
    box-shadow: 0 0.5rem 1rem rgba($color: #000000, $alpha: 0.1);
  }

  &__buttons {
    display: flex;
  }

  &__button {
    padding: 0.75rem 2rem;
    font-size: 1.125rem;
    font-family: "Roboto Condensed", sans-serif;
    border: none;
    background-color: #ff4851;
    color: #ffffff;
    margin-right: 1rem;
    border-radius: 0.25rem;
    box-shadow: 0 0.25rem 1rem rgba($color: #ff4851, $alpha: 0.25);
    text-decoration: none;
    transition: all ease-out 0.2s;

    &--inactive {
      padding: 0.75rem 2rem;
      background-color: #f4f4f4;
      color: #696969;
      font-family: "Roboto Condensed", sans-serif;
      font-size: 1.125rem;
      border: none;
      border-radius: 0.25rem;
      text-decoration: none;
      transition: all ease-out 0.2s;
    }

    &:hover,
    &--inactive:hover {
      transform: translateY(-0.25rem);
      filter: brightness(0.95);
    }
  }

  :global(.hero__pattern) {
    position: absolute;
    right: 0;
    top: 0;
    /* width: 12rem; */
    width: clamp(6rem, calc(10vw + 4rem), 12rem);
    height: 12rem;
    z-index: -1;
    color: rgba($color: #ff4851, $alpha: 0.075);
  }

  &__right {
    position: relative;

    &::before {
      position: absolute;
      content: "";
      top: 1rem;
      left: 1rem;
      width: clamp(1rem, calc(4vw + 1rem), 4rem);
      height: clamp(1rem, calc(4vw + 1rem), 4rem);
      background-color: rgba($color: #ff4851, $alpha: 0.075);
    }

    &::after {
      position: absolute;
      content: "";
      bottom: 0;
      right: 10rem;
      width: 8rem;
      height: 4rem;
      background-color: rgba($color: #ff4851, $alpha: 0.075);
    }
  }
}

@media only screen and (max-width: 1080px) {
  .hero {
    gap: 2rem;
    grid-template-columns: 1fr;
    grid-template-rows: 14rem 1fr;

    &__right::after {
      display: none;
    }

    &__button {
      display: block;
    }
  }

  :global(.hero__pattern) {
    position: absolute;
    right: 0;
    top: 0;
    height: 6rem;
    z-index: -1;
    color: rgba($color: #ff4851, $alpha: 0.075);
  }
}
</style>

<section class="hero">
  <div class="hero__left">
    <a href="https://github.com/elianiva">
      <img
        class="hero__pict"
        src="https://avatars3.githubusercontent.com/u/51877647?s=256&v=4"
        alt="github profile"
      />
    </a>
  </div>
  <div class="hero__right">
    <span class="hero__name">Hi there! I'm Elianiva.</span>
    <p class="hero__desc">
      I'm a 16 y/o boi from Indonesia. I love making random websites and
      contribute to any open sauce projects that I found interesting. I also
      love Anime and Linux related stuff, what a perfect combination to lose
      your life ツ
    </p>
    <div class="hero__buttons">
      <a class="hero__button" href="/projects">Projects</a>
      <a class="hero__button--inactive" href="/about">About</a>
    </div>
    <Circle class="hero__pattern" />
  </div>
</section>

<script>
import Circle from "./circle.svg"
</script>
