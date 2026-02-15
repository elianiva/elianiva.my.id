<script lang="ts">
import { fly } from "svelte/transition";
import PostCard from "~/components/card/PostCard.svelte";
import type { PostMeta } from "~/models/post";

type PostMetaWithSlug = PostMeta & { slug: string };
type Props = {
	posts: PostMetaWithSlug[];
};

const { posts }: Props = $props();

let inputBox: HTMLInputElement | null = null;
let searchQuery = $state("");
let tagSearchQuery = $state("");
const selectedTags = $state<string[]>([]);
let isCompletionVisible = $state(false);
let activeOptionIndex = $state(-1);
let listboxId = "tag-listbox";
let announcementText = $state("");

const allPostTags = posts.flatMap((post) => post.tags);
const tagCounts = allPostTags.reduce(
	(acc, curr) => {
		acc[curr] = (acc[curr] || 0) + 1;
		return acc;
	},
	{} as Record<string, number>,
);

const filteredPosts = $derived(
	posts.filter((post) => {
		const query = searchQuery.toLowerCase();
		const matchesSearch =
			searchQuery === "" ||
			post.title.toLowerCase().includes(query) ||
			post.slug.toLowerCase().includes(query);
		const matchesTags =
			selectedTags.length === 0 ||
			selectedTags.every((tag) => post.tags.includes(tag));
		return matchesSearch && matchesTags;
	}),
);

const availableTags = $derived(
	tagSearchQuery
		? [...new Set(allPostTags)].filter((tag) =>
				// remove # before filtering
				tag.toLowerCase().includes(tagSearchQuery.substring(1).toLowerCase()),
			)
		: [],
);

function handleInput(event: Event) {
	const inputValue = (event.currentTarget as HTMLInputElement).value;
	if (inputValue.startsWith("#")) {
		tagSearchQuery = inputValue;
		searchQuery = "";
		isCompletionVisible = true;
		activeOptionIndex = -1;
	} else {
		searchQuery = inputValue;
		tagSearchQuery = "";
		isCompletionVisible = false;
		activeOptionIndex = -1;
	}

	// Announce search results
	if (searchQuery || tagSearchQuery) {
		announcementText = `${filteredPosts.length} post${filteredPosts.length !== 1 ? "s" : ""} found.`;
		setTimeout(() => (announcementText = ""), 1000);
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (!isCompletionVisible || availableTags.length === 0) return;

	switch (event.key) {
		case "ArrowDown":
			event.preventDefault();
			activeOptionIndex = Math.min(
				activeOptionIndex + 1,
				availableTags.length - 1,
			);
			break;
		case "ArrowUp":
			event.preventDefault();
			activeOptionIndex = Math.max(activeOptionIndex - 1, 0);
			break;
		case "Enter":
		case " ":
			event.preventDefault();
			if (activeOptionIndex >= 0) {
				const tag = availableTags[activeOptionIndex];
				if (tag) {
					selectTag(tag);
				}
			}
			break;
		case "Escape":
			event.preventDefault();
			isCompletionVisible = false;
			activeOptionIndex = -1;
			break;
	}
}

function selectTag(tag: string) {
	selectedTags.push(tag);
	if (inputBox) {
		inputBox.value = "";
		inputBox.focus();
	}
	tagSearchQuery = "";
	isCompletionVisible = false;
	activeOptionIndex = -1;
	announcementText = `Added tag ${tag}. ${filteredPosts.length} post${filteredPosts.length !== 1 ? "s" : ""} found.`;
	setTimeout(() => (announcementText = ""), 1000);
}
</script>

<div class="relative">
	<div class="relative">
		<input
			class="block font-body mx-auto my-0 w-full p-3 bg-white/50 rounded-xl border-[0.5px] border-pink-200/50 outline-none text-pink-950 placeholder:text-pink-950/70 focus:border-pink-200 focus:bg-pink-50/50 transition-all"
			id="posts__input"
			type="text"
			placeholder="Find post... (start with # to find tags)"
			autocomplete="off"
			role="combobox"
			aria-label="Search posts or tags"
			aria-describedby="search-help"
			aria-expanded={isCompletionVisible}
			aria-autocomplete="list"
			aria-owns={listboxId}
			aria-activedescendant={activeOptionIndex >= 0 ? `${listboxId}-option-${activeOptionIndex}` : undefined}
			oninput={handleInput}
			onkeydown={handleKeydown}
			bind:this={inputBox}
		/>
		<div id="search-help" class="sr-only">
			Start typing to search posts, or type # to browse and select tags. Use arrow keys to navigate suggestions.
		</div>
	</div>

	{#if isCompletionVisible && tagSearchQuery}
		<div
			transition:fly={{ duration: 100, y: -50 }}
			class="absolute top-16 left-0 right-0 z-5 text-pink-950 bg-white/50 backdrop-blur-xl p-2 rounded-xl border-[0.5px] border-pink-200/50 transition-all"
			role="listbox"
			id={listboxId}
			aria-label="Available tags"
		>
			{#if availableTags.length > 0}
				{#each availableTags as tag, i}
					<button
						id={`${listboxId}-option-${i}`}
						role="option"
						class="flex justify-between items-center text-left text-sm w-full font-mono p-2 cursor-pointer transition-property-all ease-out duration-100 rounded-lg hover:bg-pink-200/80 focus:border-pink-200 focus:bg-pink-200/80"
						aria-selected={i === activeOptionIndex}
						onclick={() => selectTag(tag)}
						onkeydown={() => void 0}
					>
						<span>{tag.toUpperCase()}{#if i === activeOptionIndex} <span aria-hidden="true">←</span>{/if}</span>
						<span class="text-pink-950/60">{tagCounts[tag]} result{(tagCounts[tag] ?? 0) > 1 ? "s" : ""}</span>
					</button>
				{/each}
			{:else}
				<div
					role="option"
					aria-disabled="true"
					class="block text-left font-heading text-lg p-2 cursor-not-allowed transition-property-all ease-out duration-100 rounded-lg"
				>
					No result
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Screen reader announcements -->
<div
	aria-live="polite"
	aria-atomic="true"
	class="sr-only"
>
	{announcementText}
</div>

{#if selectedTags.length > 0}
	<div class="flex items-center gap-4 mt-2" role="group" aria-label="Selected tags">
		{#each selectedTags as tag}
			<button
				class="text-xs font-mono text-pink-950/70 bg-pink-50/80 px-2 py-0.5 rounded-full hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
				aria-label={`Remove tag ${tag}`}
				onclick={() => {
					selectedTags.splice(selectedTags.indexOf(tag), 1);
				}}
			>
				#{tag} ×
			</button>
		{/each}
	</div>
{/if}

<div
	role="region"
	aria-live="polite"
	aria-label={`Search results: ${filteredPosts.length} post${filteredPosts.length !== 1 ? 's' : ''} found`}
	class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3 mt-4"
>
	{#each filteredPosts as post}
		<PostCard {...post} href="/posts/{post.slug}" />
	{/each}
</div>
