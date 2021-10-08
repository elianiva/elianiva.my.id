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
  font-size: 1.5rem;
  font-family: "Rubik", sans-serif;
  font-weight: 500;
  color: var(--color-main-accent);
}

.hero__name {
  position: relative;
  display: block;
  font-family: "Rubik", sans-serif;
  font-size: clamp(1.25rem, calc(5vw + 1.25rem), 3.5rem);
  font-weight: 600;
  line-height: 1.25em;
}

.hero__role {
  font-family: "Rubik", sans-serif;
  font-size: clamp(1rem, calc(5vw + 0.5rem), 2rem);
  display: block;
  line-height: 1.5em;
}

.hero__desc {
  position: relative;
  display: block;
  color: var(--color-alt-text);
  font-family: "Inter", sans-serif;
  font-size: clamp(0.8rem, calc(2vw + 0.5rem), 1.125rem);
  line-height: 1.5em;
  margin: 0 0 1rem;
}

.hero__pict {
  width: clamp(12rem, calc(20vw + 4rem), 16rem);
  height: clamp(12rem, calc(20vw + 4rem), 16rem);
  border-radius: 10rem;
  border: 0.5rem var(--color-alt-bg) solid;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
}

.hero__right {
  position: relative;
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
}
</style>

<section class="hero">
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
    <span class="hero__role">A Software Developer and I love Open Source!</span>
    <p class="hero__desc">
      I'm a 17 y/o boi from Indonesia. I like to write code and contribute to
      open source projects. I speak Indonesia, English, and a little bit of
      Japanese. Feel free to hit me up!
    </p>
  </div>
</section>
