<script lang="ts">
export let title: string;
export let description: string;
export let href: string;
export let stack: [stack: string, url: string][];
</script>

<div class="overflow-hidden text-left p-3 rounded-sm border border-dashed border-pink-300">
	<!--	<img-->
	<!--		class="relative block w-full h-48 object-cover bg-white z-[2]"-->
	<!--		src={imageSource}-->
	<!--		alt={title}-->
	<!--		loading="lazy"-->
	<!--	/>-->
	<div class="grid grid-rows-[auto_auto_auto]">
		<a
			data-sveltekit-prefetch
			rel="prefetch"
			href={href}
			class="text-lg font-bold font-serif text-pink-950"
		>
			{title}
		</a>
		<p class="font-serif text-sm text-pink-950/70 pt-1 pb-3">
			{description}
		</p>
		<div class="flex flex-wrap items-end gap-2">
			{#each stack as [name, url]}
				<a
					href={url}
					target="_blank"
					rel="norel noreferrer"
					class="no-underline text-xs text-pink-900/70 hover:text-pink-900/90 bg-pink-50 py-1 px-3 rounded-md"
				>
					{name}
				</a>
			{/each}
		</div>
	</div>
</div>
