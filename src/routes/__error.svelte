<svelte:head>
  <title>{status} | Elianiva's Site</title>
</svelte:head>

<div
  class="h-full flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 text-center px-4"
>
  {#if status === 404}
    <h1 class="text-6xl font-heading mt-8">{status}</h1>
    <span class="text-3xl font-sans">
      Sorry, you might have entered the wrong URL.
      <br />
      Wanna go back
      <a
        class="relative inline-block text-blue-600 dark:text-red-500 no-underline hover:underline transition-property-all ease-out duration-200"
        href="/"
      >
        home?
      </a>
    </span>
  {:else}
    <span class="err__msg"> Something went wrong. </span>
  {/if}
</div>

<script lang="ts">
export let status: number = 404;
</script>
