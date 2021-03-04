<style>
.update {
  background-color: var(--color-alt-bg);
  border: 0.0625rem var(--color-borders) solid;
  border-left: 0.125rem var(--color-main-accent) solid;
}

.update__header {
  padding: 0.5rem 1rem;
  background-color: var(--color-main-bg);
  color: var(--color-main-text);
  font-family: "Overpass", sans-serif;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.update__title {
  font-weight: 600;
}

.update__date {
  color: var(--color-alt-text);
}

.update__content {
  padding: 1rem;
  color: var(--color-main-text);
  background-color: var(--color-alt-bg);
  font-size: 1.125rem;
  line-height: 1.75em;
}
</style>

<section class="update">
  <div class="update__header">
    <span class="update__title">UPDATE</span>
    <span class="update__date">{formattedDate}</span>
  </div>
  <div class="update__content">
    <slot />
  </div>
</section>

<script>
export let date

const d = new Date(date.substring(6, 10), date.substring(3, 5), date.substring(0, 2))
const formattedDate = d.toLocaleDateString("en-UK", {
  weekday: "short",
  year: "numeric",
  month: "long",
  day: "numeric",
})
</script>
