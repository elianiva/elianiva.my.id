<script lang="ts">
interface Props {
	id: string;
	title: string;
	tags: string[];
	backlink_count?: number;
}

let props: Props = $props();
// svelte-ignore state_referenced_locally
let { id, title, tags, backlink_count = 0 } = props

const initial = title.charAt(0).toUpperCase();
const displayTags = tags
	.filter((t) => t !== "public" && t !== "person")
	.slice(0, 3);
</script>

<article class="group" style="view-transition-name: note-card-{id}">
	<a
		href={`/notes/${id}`}
		class="flex items-center gap-3 p-3 rounded-xl border border-dashed border-pink-200 bg-white/40 hover:bg-white/60 transition-colors duration-200"
	>
		<!-- avatar -->
		<div class="shrink-0 w-10 h-10 rounded-full bg-pink-100/70 border border-dashed border-pink-200 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
			<span class="font-display text-sm font-bold text-pink-500">{initial}</span>
		</div>

		<div class="flex-1 min-w-0">
			<h3 class="font-display text-sm font-semibold text-pink-950 group-hover:text-pink-700 transition-colors truncate">
				{title}
			</h3>
			{#if displayTags.length > 0}
				<p class="text-xs text-pink-950/50 mt-0.5 truncate">
					{displayTags.map((t) => `#${t}`).join(" ")}
				</p>
			{/if}
		</div>

		{#if backlink_count > 0}
			<span class="shrink-0 text-xs text-pink-400 whitespace-nowrap">← {backlink_count}</span>
		{/if}
	</a>
</article>
