{#if $navigating}
  <div
    class="fixed left-0 w-0 h-1 z-50 bg-blue-600 dark:bg-red-500 z-50 transition-property-width ease-out duration-500"
    style="width: {width}%"
  />
{/if}

<script>
import { onMount, onDestroy } from "svelte";
import { navigating } from "$app/stores";

let counter;
let width = 0;
let speed = 10;

const resetProgress = () => {
  clearInterval(counter);
  width = 0;
  speed = 0;
};

const startProgress = () => {
  counter = setInterval(() => {
    if (width === 95) {
      clearInterval(counter);
      return;
    }
    width += 5;
    speed += 500;
  }, speed);
};

$: if (!$navigating) resetProgress();
$: if ($navigating) startProgress();

onMount(() => startProgress());
onDestroy(() => resetProgress());
</script>
