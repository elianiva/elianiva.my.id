<style>
.header {
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

.header__greet {
  font-size: 1.25rem;
  font-family: var(--font-heading);
  font-weight: 500;
  color: var(--color-main-accent);
}

.header__name {
  position: relative;
  display: block;
  font-family: var(--font-heading);
  font-size: clamp(1.25rem, calc(5vw + 1.25rem), 3rem);
  font-weight: 600;
  line-height: 1.25em;
  color: var(--color-shine);
}

.header__role {
  font-family: var(--font-heading);
  font-size: clamp(1rem, calc(5vw + 0.5rem), 1.625rem);
  color: var(--color-shine);
  display: block;
  line-height: 1.75em;
}

.header__desc {
  position: relative;
  display: block;
  color: var(--color-alt-text);
  font-family: var(--font-sans);
  font-size: clamp(0.8rem, calc(2vw + 0.5rem), 1.125rem);
  line-height: 1.5em;
  margin: 0 0 1rem;
}

.header__pict {
  width: clamp(12rem, calc(20vw + 4rem), 16rem);
  height: clamp(12rem, calc(20vw + 4rem), 16rem);
  border-radius: 10rem;
  border: 0.5rem var(--color-alt-bg) solid;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
}

.header__right {
  position: relative;
}

@media only screen and (max-width: 960px) {
  .header {
    gap: 2rem;
    grid-template-columns: 1fr;
    grid-template-rows: 14rem 1fr;
    text-align: center;
    margin-top: 0;
    gap: 1rem;
  }
}
</style>

<section class="header">
  <div class="header__left">
    <a href="https://github.com/elianiva">
      <img
        class="header__pict"
        src="https://avatars3.githubusercontent.com/u/51877647?s=240&v=4"
        alt="github profile"
      />
    </a>
  </div>
  <div class="header__right">
    <span class="header__greet">Hi there!</span>
    <span class="header__name"> I'm Elianiva. </span>
    <span class="header__role">
      A Software Developer and I love Open Source!
    </span>
    <p class="header__desc">
      I like to write code and contribute to open source projects, and sometimes
      write something in this blog. I speak Indonesia, English, and a little bit
      of Japanese. Feel free to hit me up!
    </p>
  </div>
</section>
