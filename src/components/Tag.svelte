<button
	class="font-sans text-sm font-medium text-black {variant === "solid" ? "px-3 py-1 border-2 border-slate-900" : "border-none"}"
	tabindex="0"
	on:click={() => onClick?.()}
	on:keydown={(e) => e.key === "Enter" && onClick?.()}
>
	<slot />
</button>

<script lang="ts">
export let onClick: (() => void) | undefined = undefined;
export let variant: "ghost" | "solid" = "ghost";
</script>
