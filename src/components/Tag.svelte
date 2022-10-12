<div
	class="shadow-md text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 font-sans text-lg inline px-1 cursor-pointer"
	on:click={onClick}
>
	<div class="p-2">#{label}</div>
</div>

<script lang="ts">
export let label: string;
export let onClick: () => void;
</script>
