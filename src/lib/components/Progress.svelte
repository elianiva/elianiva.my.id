<style>
.button {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  width: 2.5rem;
  height: 2.5rem;
  background-color: var(--color-alt-bg);
  border: 0.0625rem var(--color-borders) solid;
  box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.1);
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-main-text);
}

.button:hover {
  filter: var(--filter-brightness);
}

:global(.button__icon) {
  color: var(--color-main-text);
}
</style>

<svelte:window bind:scrollY={currentPosition} />

{#if currentPosition > 50}
  <div
    class="button"
    on:click={scrollToTop}
    transition:fade={{ duration: 100 }}
  >
    <Up width="24" height="24" className="button__icon" />
  </div>
{/if}

<script lang="ts">
import { fade } from "svelte/transition";
import Up from "$lib/icons/Up.svelte";

let currentPosition: number;

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
</script>
