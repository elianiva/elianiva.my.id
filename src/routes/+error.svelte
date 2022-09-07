<svelte:head>
	<title>{$page.status} | Elianiva's Site</title>
</svelte:head>

<div class="h-full flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 text-center px-4">
	<h1 class="text-6xl font-heading mt-8">{$page.status}</h1>
	{#if $page.status === 404}
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
		<span class="text-3xl font-sans">Reason: {$page.error.message}</span>
	{/if}
</div>

<script lang="ts">
import { page } from "$app/stores";
</script>
