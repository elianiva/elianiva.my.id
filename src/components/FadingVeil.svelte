<script lang="ts">
import ArrowDownIcon from "~icons/ph/arrow-circle-down";

export let expanded: boolean;
export let onClick: () => void;
</script>

<div class="absolute inset-0 bg-gradient-to-t {expanded ? 'from-transparent' : 'from-white'} to-transparent z-50">
	<button
		class="text-sm animate-bounce flex flex-col items-center absolute left-1/2 -translate-x-1/2 bottom-0 uppercase rounded-md font-mono text-pink-950 cursor-pointer"
		on:click={onClick}
	>
		<ArrowDownIcon class="w-6 h-6 text-pink-950/80 {expanded ? 'rotate-180' : 'rotate-0'}" />
	</button>
</div>