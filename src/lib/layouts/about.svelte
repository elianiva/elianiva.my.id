<style>
.about__content :global(h1 *),
.about__content :global(h2 *) {
  @apply no-underline;
  color: var(--color-shine);
}

.about__content :global(h1),
.about__content :global(h2) {
  @apply relative font-heading;
}

.about__content :global(h1) {
  @apply text-3xl mb-4;
}

.about__content :global(h2) {
  @apply text-2xl mt-10 mb-2;
}

.about__content :global(h1:not(:first-child)) {
  @apply mt-12;
}

.about__content :global(h1::after) {
  content: "";
  @apply absolute left-0 right-0 bottom-0 h-[0.125rem] bg-fading-line;
}

.about__content :global(.about__paren) {
  color: var(--color-alt-text);
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

<section class="max-w-screen-lg mx-auto pt-8 px-4 pb-0 ">
  <section
    class="max-w-[80ch] mx-auto prose prose-slate dark:prose-invert prose-a:no-underline prose-headings:relative prose-headings:font-heading prose-headings:font-extrabold text-slate-600 dark:text-slate-400 prose-h1:after:absolute prose-h1:after:left-0 prose-h1:after:right-0 prose-h1:after:bottom-0 prose-h1:after:h-[0.125rem] prose-h1:after:bg-fading-line"
  >
    <slot />
  </section>
</section>
