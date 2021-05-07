<style>
.tag {
  background-color: var(--color-special-bg);
  border-radius: 0.25rem;
  font-family: "Overpass", sans-serif;
  font-size: 1.125rem;
  display: inline-grid;
  grid-template-columns: 1fr 2rem;
  align-items: center;
  justify-content: space-between;
  color: var(--color-alt-text);
}

.tag__name {
  padding: 0.5rem;
}

.tag__remove {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0 0.25rem 0.25rem 0;
  background-color: var(--color-borders);
  cursor: pointer;
}
</style>

<div class="tag">
  <div class="tag__name"><b>#</b> {label}</div>
  <div class="tag__remove" on:click={onClick}>&times;</div>
</div>

<script lang="ts">
export let label: string;
export let onClick: () => void;
</script>
