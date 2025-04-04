<script lang="ts">
type Props = {
	title: string;
	description: string;
	href: string;
	stack: [stack: string, url: string][];
};

const { title, description, href, stack }: Props = $props();
</script>

<div class="overflow-hidden text-left p-3 rounded-sm border border-dashed border-pink-300 bg-white">
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
		<div class="flex flex-wrap items-end gap-2 font-mono uppercase">
			{#each stack as [name, url]}
				<a
					href={url}
					target="_blank"
					rel="norel noreferrer"
					class="no-underline text-xs text-pink-900/70 hover:text-pink-900/90 bg-pink-50 px-2 py-1 rounded-md"
				>
					{name}
				</a>
			{/each}
		</div>
	</div>
</div>
