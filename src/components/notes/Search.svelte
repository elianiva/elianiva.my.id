<script lang="ts">
import Fuse from "fuse.js";
import { onMount } from "svelte";

interface Note {
	id: string;
	title: string;
	description?: string;
	category: string;
	tags: string[];
}

interface Props {
	notes: Note[];
	onSearch?: (filteredIds: string[] | null) => void;
}

let { notes, onSearch }: Props = $props();

let query = $state("");
let results: Fuse.FuseResult<Note>[] = $state([]);
let fuse: Fuse<Note>;

onMount(() => {
	fuse = new Fuse(notes, {
		keys: [
			{ name: "title", weight: 2 },
			{ name: "description", weight: 1 },
			{ name: "tags", weight: 1.5 },
		],
		threshold: 0.3,
		includeScore: true,
	});
});

$effect(() => {
	if (query.trim() && fuse) {
		results = fuse.search(query);
		onSearch?.(results.map((r) => r.item.id));
	} else {
		results = [];
		onSearch?.(null);
	}
});

const categoryLabels: Record<string, string> = {
	article: "Article",
	vault: "Vault",
	person: "Person",
	music: "Music",
};
</script>

<div class="relative">
	<div class="relative">
		<input
			type="text"
			placeholder="Search notes..."
			bind:value={query}
			class="w-full px-3 py-2 pl-11 rounded-xl border-[0.5px] border-pink-200 bg-white/60 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-pink-400 text-pink-950 placeholder:text-pink-950/40 text-sm"
		/>
		<svg
			class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-950/40"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
		{#if query}
			<button
				type="button"
				aria-label="Clear search"
				onclick={() => (query = "")}
				class="absolute right-3 top-1/2 -translate-y-1/2 text-pink-950/40 hover:text-pink-950/70"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		{/if}
	</div>

	{#if query && results.length > 0}
		<div
			class="absolute z-10 w-full mt-2 bg-white/90 backdrop-blur-sm rounded-xl border-[0.5px] border-pink-200 shadow-lg max-h-96 overflow-auto"
		>
			{#each results as result}
				<a
					href={`/notes/${result.item.id}`}
					class="block p-4 hover:bg-pink-50/50 transition-colors border-b border-pink-100 last:border-b-0"
				>
					<div class="flex items-start justify-between gap-2">
						<div>
							<h4 class="font-medium text-pink-950">{result.item.title}</h4>
							{#if result.item.description}
								<p class="text-sm text-pink-950/60 mt-1 line-clamp-2">
									{result.item.description}
								</p>
							{/if}
						</div>
						<span
							class="text-xs px-2 py-1 rounded-full bg-pink-100/50 text-pink-900 shrink-0"
						>
							{categoryLabels[result.item.category]}
						</span>
					</div>
				</a>
			{/each}
		</div>
	{:else if query}
		<div
			class="absolute z-10 w-full mt-2 bg-white/90 backdrop-blur-sm rounded-xl border border-dashed border-pink-200 p-4 text-center text-pink-950/50"
		>
			No results found
		</div>
	{/if}
</div>
