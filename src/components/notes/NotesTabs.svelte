<script lang="ts">
import { onMount } from "svelte";
import ArticleCard from "./ArticleCard.svelte";
import MusicCard from "./MusicCard.svelte";
import PeopleCard from "./PeopleCard.svelte";
import VaultCard from "./VaultCard.svelte";

interface Note {
	id: string;
	title: string;
	description?: string;
	category: string;
	tags: string[];
	created_at: string;
	modified_at: string;
	url?: string;
	author?: string;
	artist?: string;
	album?: string;
	year?: string[];
	links?: string[];
	backlink_count?: number;
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

<div class="space-y-4">
	<!-- Tab bar -->
	<div class="relative flex flex-wrap gap-4 border-b border-pink-300/50 pb-2">
		<!-- floating indicator -->
		<span class="tab-indicator"></span>
		{#each categories as cat}
			{@const count = categoryCounts[cat]}
			{@const isActive = activeTab === cat}
			<button
				onclick={() => setTab(cat)}
				class="tab-btn relative flex items-center gap-2 text-sm font-medium transition-colors pb-1 cursor-pointer
					outline-none focus-visible:ring-2 focus-visible:ring-pink-400/40 rounded px-2 py-1
					{isActive ? 'text-pink-600' : 'text-pink-950/50 hover:text-pink-950/80'}"
				aria-pressed={isActive}
				style={isActive ? 'anchor-name: --active-tab' : ''}
			>
				{categoryLabels[cat]}
				<span
					class="text-xs px-1.5 py-0.5 rounded
						{isActive ? 'bg-pink-100 text-pink-600' : 'bg-pink-50 text-pink-400'}"
				>
					{count}
				</span>
			</button>
		{/each}
	</div>

	<!-- Notes grid -->
	{#if displayedNotes.length === 0}
		<div class="text-center py-12 text-pink-950/50">
			<p>No notes found in this category.</p>
			{#if filteredIds !== null}
				<p class="text-sm mt-1">Try adjusting your search.</p>
			{/if}
		</div>
	{:else if activeTab === "article"}
		<div class="grid gap-2">
			{#each displayedNotes as note (note.id)}
				<ArticleCard
					id={note.id}
					title={note.title}
					description={note.description}
					tags={note.tags}
					created_at={note.created_at}
					url={note.url}
					author={note.author}
				/>
			{/each}
		</div>
	{:else if activeTab === "vault"}
		<div class="grid gap-2">
			{#each displayedNotes as note (note.id)}
				<VaultCard
					id={note.id}
					title={note.title}
					description={note.description}
					tags={note.tags}
					created_at={note.created_at}
				/>
			{/each}
		</div>
	{:else if activeTab === "music"}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
			{#each displayedNotes as note (note.id)}
				<MusicCard
					id={note.id}
					title={note.title}
					tags={note.tags}
					artist={note.artist}
					album={note.album}
					year={note.year}
					description={note.description}
				/>
			{/each}
		</div>
	{:else if activeTab === "person"}
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
			{#each displayedNotes as note (note.id)}
				<PeopleCard
					id={note.id}
					title={note.title}
					tags={note.tags}
					backlink_count={note.backlink_count}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.tab-indicator {
		position: absolute;
		position-anchor: --active-tab;
		bottom: -1px;
		left: anchor(left);
		width: anchor-size(width);
		height: 2px;
		background-color: var(--color-pink-500);
		transition:
			left 0.2s ease,
			width 0.2s ease;
	}
</style>
