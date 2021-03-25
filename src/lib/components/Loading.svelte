<style>
.loading {
  position: fixed;
  top: 4rem;
  left: 0;
  height: 0.25rem;
  background-color: var(--color-main-accent);
  z-index: 50;
  transition: width ease-out 0.5s;
  width: 0;
}
</style>

{#if $navigating}
  <div class="loading" style="width: {width}%" />
{/if}

<script>
import { onMount, onDestroy } from "svelte"
import { navigating } from "$app/stores"

let counter
let width = 0
let speed = 10

const resetProgress = () => {
  clearInterval(counter)
  width = 0
  speed = 0
}

const startProgress = () => {
  counter = setInterval(() => {
    if (width === 95) {
      clearInterval(counter)
      return
    }
    width += 5
    speed += 500
  }, speed)
}

$: if (!$navigating) resetProgress()
$: if ($navigating) startProgress()

onMount(() => startProgress())
onDestroy(() => resetProgress())
</script>
