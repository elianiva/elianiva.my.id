<script lang="ts">
interface Note {
	id: string;
	title: string;
	description?: string;
	category: string;
	tags: string[];
	created_at: string;
	modified_at: string;
}

interface Props {
	note: Note;
}

let { note }: Props = $props();
// svelte-ignore state_referenced_locally
const { title, category, tags, created_at, description } = note;

const categoryColors: Record<string, string> = {
	article: "bg-yellow-100/50 text-yellow-900",
	vault: "bg-sky-100/50 text-sky-900",
	person: "bg-pink-100/50 text-pink-900",
	music: "bg-purple-100/50 text-purple-900",
};

const categoryLabels: Record<string, string> = {
	article: "Article",
	vault: "Vault",
	person: "Person",
	music: "Music",
};

const date = new Date(created_at).toLocaleDateString("en-US", {
	year: "numeric",
	month: "short",
	day: "numeric",
});

// Filter out 'public' and 'article' tag from display
const displayTags = tags.filter((t) => t !== "public" && t !== "article");
</script>

<article class="group">
	<a
		href={`/notes/${note.id}`}
		class="block p-4 rounded-xl border border-dashed border-pink-200 bg-white/40 hover:bg-white/60 transition-colors duration-200"
	>
		<div class="flex items-start justify-between gap-3">
			<div class="flex-1 min-w-0">
				<h3
					class="font-display text-lg font-semibold text-pink-950 group-hover:text-pink-700 transition-colors"
				>
					{title}
				</h3>
				{#if description}
					<p class="text-sm text-pink-950/60 mt-1 line-clamp-2">
						{description}
					</p>
				{/if}
			</div>
			<span
				class="text-xs font-medium px-2 py-1 rounded-full shrink-0 {categoryColors[category]}"
			>
				{categoryLabels[category]}
			</span>
		</div>

		<div class="flex items-center gap-3 mt-3 text-xs text-pink-950/50">
			<time datetime={created_at}>{date}</time>
			{#if displayTags.length > 0}
				<span>·</span>
				<span class="truncate">
					{displayTags.slice(0, 3).map(t => `#${t}`).join(" ")}
					{displayTags.length > 3 ? ` +${displayTags.length - 3}` : ""}
				</span>
			{/if}
		</div>
	</a>
</article>
