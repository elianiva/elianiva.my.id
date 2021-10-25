<style>
.about {
  max-width: 1080px;
  margin: 0 auto;
  color: var(--color-main-text);
  padding: 2rem 1rem 0;
}

.about__content {
  max-width: 80ch;
  margin: auto;
}

.about__content > :global(p + p) {
  margin-top: 1.5rem;
}

.about__content :global(h1 *),
.about__content :global(h2 *) {
  text-decoration: none;
  color: var(--color-shine);
}

.about__content :global(h1),
.about__content :global(h2) {
  position: relative;
  font-family: var(--font-heading);
}

.about__content :global(h1) {
  font-size: 1.75rem;
  margin: 0 0 1rem;
}

.about__content :global(h2) {
  font-size: 1.5rem;
  margin: 2.5rem 0 0.5rem;
}

.about__content :global(h1:not(:first-child)) {
  margin-top: 3rem;
}

.about__content :global(h1::after) {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0.125rem;
  background-image: linear-gradient(
    to right,
    var(--color-main-accent),
    rgba(0, 0, 0, 0)
  );
}

.about__content :global(p) {
  font-family: var(--font-sans);
  color: var(--color-main-text);
  font-size: 1.125rem;
  line-height: 2em;
}

.about__content :global(.about__paren) {
  color: var(--color-alt-text);
}

.about__content :global(ul) {
  list-style-position: inside;
}

.about__content :global(li) {
  padding: 1rem 0 0;
}

.about__content :global(li p:first-child) {
  display: inline;
  font-size: 1.125rem;
  font-weight: 600;
  font-family: var(--font-heading);
  color: var(--color-shine);
}

.about__content :global(li p:not(:first-child)) {
  font-family: var(--font-sans);
  color: var(--color-main-text);
  font-size: 1.05rem;
  line-height: 1.75em;
  padding-left: 1.5rem;
}

.about__content :global(code) {
  font-family: var(--font-monospace);
  color: var(--color-main-accent);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  background-color: var(--color-alt-bg);
  box-shadow: 0 0 0.25em rgba(0, 0, 0, 0.1);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.about__content :global(del) {
  text-decoration: line-through;
  color: var(--color-alt-text);
}

.about__content :global(p a) {
  position: relative;
  display: inline-block;
  color: var(--color-shine);
  text-decoration: none;
  z-index: 5;
}

.about__content :global(p a:hover) {
  color: var(--color-main-accent);
}

.about__content :global(p a::after) {
  content: "";
  position: absolute;
  background-color: var(--color-main-accent);
  bottom: 0.25rem;
  left: 0;
  right: 0;
  height: 2px;
  z-index: -1;
}
</style>

<section class="about">
  <section class="about__content">
    <slot />
  </section>
</section>
