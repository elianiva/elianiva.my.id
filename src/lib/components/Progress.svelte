<svelte:window bind:scrollY={currentPosition} />

{#if currentPosition > 50}
  <div
    class="fixed right-8 bottom-8 w-10 h-10 bg-blue-600 dark:bg-red-500 text-white rounded-md shadow-md z-[5] flex items-center justify-center cursor-pointer hover:brightness-95"
    on:click={scrollToTop}
    transition:fade={{ duration: 100 }}
  >
    <UpIcon class="text-white" />
  </div>
{/if}

<script lang="ts">
import { fade } from "svelte/transition";
import UpIcon from "~icons/ph/caret-up-bold";

let currentPosition: number;

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
</script>
