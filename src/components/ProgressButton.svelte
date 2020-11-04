<style>
.button {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 2rem;
  background-color: var(--color-alt-bg);
  box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.2);
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ease-out 0.2s;
  color: var(--color-main-text);
}

.button:hover {
  filter: brightness(1.2);
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
    <Up width="1.5rem" height="1.5rem" class="button__icon" />
  </div>
{/if}

<script>
import { fade } from "svelte/transition"
import Up from "@/icons/up.svg"

let currentPosition

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })
</script>
