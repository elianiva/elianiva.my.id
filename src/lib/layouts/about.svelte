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
  color: var(--color-main-text);
}

.about__content :global(h1),
.about__content :global(h2) {
  position: relative;
  font-family: "Overpass", sans-serif;
}

.about__content :global(h1) {
  font-size: 1.75rem;
  margin: 0 0 1rem;
}

.about__content :global(h2) {
  font-size: 1.5rem;
  margin: 0.5rem 0 0.5rem;
}

.about__content :global(h1:not(:first-child)) {
  margin-top: 2rem;
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
  font-family: "Open Sans", sans-serif;
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
  padding-bottom: 1rem;
}

.about__content :global(li p:first-child) {
  display: inline;
  font-size: 1.125rem;
  font-weight: 600;
  font-family: "Overpass", sans-serif;
}

.about__content :global(li p:not(:first-child)) {
  font-family: "Open Sans", sans-serif;
  color: var(--color-main-text);
  font-size: 1rem;
  line-height: 1.75em;
  padding-left: 1.5rem;
}

.about__content :global(code) {
  font-family: "JetBrains Mono", monospace;
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
</style>

<section class="about">
  <section class="about__content">
    <slot />
  </section>
</section>
