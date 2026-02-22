<script lang="ts">
import { onMount } from "svelte";
import NoteCard from "./NoteCard.svelte";

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
	notes: Note[];
	filteredIds?: string[] | null;
}

let { notes, filteredIds = null }: Props = $props();

const categories = ["article", "vault", "person", "music"] as const;
type Category = (typeof categories)[number];

const categoryLabels: Record<Category, string> = {
	article: "Articles",
	vault: "Vault",
	person: "People",
	music: "Music",
};

const categoryHashMap: Record<string, Category> = {
	articles: "article",
	vault: "vault",
	people: "person",
	music: "music",
};

const hashToCategoryMap: Record<Category, string> = {
	article: "articles",
	vault: "vault",
	person: "people",
	music: "music",
};

let activeTab = $state<Category>("article");

// Filter notes by search results if provided, then by active category
let displayedNotes = $derived.by(() => {
	let filtered = notes;
	if (filteredIds !== null) {
		filtered = notes.filter((n) => filteredIds?.includes(n.id));
	}
	return filtered.filter((n) => n.category === activeTab);
});

let categoryCounts = $derived.by(() => {
	const counts: Record<Category, number> = {
		article: 0,
		vault: 0,
		person: 0,
		music: 0,
	};
	let filtered = notes;
	if (filteredIds !== null) {
		filtered = notes.filter((n) => filteredIds?.includes(n.id));
	}
	for (const note of filtered) {
		if (counts[note.category as Category] !== undefined) {
			counts[note.category as Category]++;
		}
	}
	return counts;
});

function setTab(category: Category) {
	activeTab = category;
	const hash = hashToCategoryMap[category];
	window.history.replaceState(null, "", `#${hash}`);
}

onMount(() => {
	const hash = window.location.hash.slice(1);
	if (hash && categoryHashMap[hash]) {
		activeTab = categoryHashMap[hash];
	}
});
</script>

<div class="space-y-6">
	<!-- Tab buttons -->
	<div class="flex flex-wrap gap-2 border-b border-dashed border-pink-200 pb-4">
		{#each categories as cat}
			{@const count = categoryCounts[cat]}
			{@const isActive = activeTab === cat}
			{@const hasNotes = count > 0}
			<button
				onclick={() => setTab(cat)}
				class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
					{isActive
						? 'bg-pink-500 text-white shadow-sm'
						: 'bg-white/40 text-pink-950/70 hover:bg-white/60'}
					{!hasNotes ? 'opacity-50 cursor-not-allowed' : ''}"
				disabled={!hasNotes}
				aria-pressed={isActive}
			>
				{categoryLabels[cat]}
				<span
					class="text-xs px-2 py-0.5 rounded-full
						{isActive ? 'bg-white/20 text-white' : 'bg-pink-100/50 text-pink-900'}"
				>
					{count}
				</span>
			</button>
		{/each}
	</div>

	<!-- Notes grid for active tab -->
<div class="grid gap-4">
		{#if displayedNotes.length === 0}
			<div class="text-center py-12 text-pink-950/50">
				<p>No notes found in this category.</p>
				{#if filteredIds !== null}
					<p class="text-sm mt-1">Try adjusting your search.</p>
				{/if}
			</div>
		{:else}
			{#each displayedNotes as note}
				<NoteCard {note} />
			{/each}
		{/if}
	</div>
</div>
