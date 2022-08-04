{#key url}
	<div
		class="flex-1 pt-10"
		in:fly={{ y: -20, duration: transitionDuration, delay: transitionDuration }}
		out:fly={{ y: 20, duration: transitionDuration }}
	>
		<slot />
	</div>
{/key}

<script>
import { fly } from "svelte/transition";

const transitionDuration = 200;
export let url = "";
</script>
