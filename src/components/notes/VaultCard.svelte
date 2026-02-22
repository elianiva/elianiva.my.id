<script lang="ts">
interface Props {
	id: string;
	title: string;
	description?: string;
	tags: string[];
	created_at: string;
}

let props: Props = $props();
// svelte-ignore state_referenced_locally
let { id, title, description, tags, created_at } = props

const date = new Date(created_at).toLocaleDateString("en-US", {
	year: "numeric",
	month: "short",
	day: "numeric",
});

const displayTags = tags
	.filter((t) => t !== "public" && t !== "vault")
	.slice(0, 4);
</script>

<article class="group" style="view-transition-name: note-card-{id}">
	<a
		href={`/notes/${id}`}
		class="relative block p-4 rounded-xl border border-dashed border-sky-200 bg-white/40 hover:bg-white/60 transition-colors duration-200 overflow-hidden"
		style="clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)"
	>
		<!-- folded corner -->
		<div
			class="absolute top-0 right-0 w-0 h-0 border-l-16 border-b-16 border-l-sky-200 border-b-transparent group-hover:border-l-sky-300 transition-colors"
		></div>

		<h3 class="font-display text-base font-semibold text-pink-950 group-hover:text-sky-700 transition-colors leading-snug pr-3">
			{title}
		</h3>
		{#if description}
			<p class="text-sm text-pink-950/60 mt-1 line-clamp-2">{description}</p>
		{/if}

		<div class="flex flex-wrap items-center gap-1.5 mt-3">
			{#each displayTags as tag}
				<span class="text-xs px-1.5 py-0.5 rounded bg-sky-100/60 text-sky-800">#{tag}</span>
			{/each}
			{#if tags.filter((t) => t !== "public" && t !== "vault").length > 4}
				<span class="text-xs text-pink-950/40">+{tags.filter((t) => t !== "public" && t !== "vault").length - 4}</span>
			{/if}
		</div>

		<div class="mt-3 text-xs text-pink-950/40">
			<time datetime={created_at}>{date}</time>
		</div>
	</a>
</article>
