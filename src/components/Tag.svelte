<span
	class={`font-heading font-medium ${variant === "ghost" ? "bg-rose-100 text-rose-700" : "shadow-sharp border-2 border-rose-900 bg-white text-zinc-900"} text-sm no-underline gap-2 py-1 px-2 mt-2 uppercase transition-property-filter duration-200 ease-out cursor-pointer`}
	tabindex="0"
	on:click={() => onClick?.()}
>
	<slot />
</span>

<script lang="ts">
export let onClick: (() => void) | undefined = undefined;
export let variant: "ghost" | "solid" = "ghost"
</script>
