<style>
.tag {
  background-color: var(--color-alt-bg);
  box-shadow: var(--card-shadow);
  border-radius: 0.25rem;
  font-family: var(--font-sans);
  font-size: 1.125rem;
  display: inline;
  padding: 0 0.25rem;
  color: var(--color-alt-text);
  cursor: pointer;
}

.tag__name {
  padding: 0.5rem;
}
</style>

<div class="tag" on:click={onClick}>
  <div class="tag__name">#{label}</div>
</div>

<script lang="ts">
export let label: string;
export let onClick: () => void;
</script>
