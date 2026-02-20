<script lang="ts">
interface Props {
	term: string;
	definition: string;
}

let { term, definition }: Props = $props();
</script>

<span
	class="group relative inline-block cursor-help border-b border-dashed border-pink-400 text-pink-700 hover:text-pink-900 transition-colors"
>
	{term}
	<span
		class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 w-64 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1"
	>
		<span
			class="block rounded-2xl border-[0.5px] border-pink-200/60 bg-linear-to-bl from-white to-pink-50 p-4 shadow-card"
		>
			<span
				class="inline-block text-sm text-left! text-pink-950 font-body leading-relaxed"
			>
				{definition}
			</span>
		</span>
		<span
			class="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r-[0.5px] border-b-[0.5px] border-pink-200 bg-pink-50"
		></span>
	</span>
</span>
