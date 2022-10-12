<div class="relative">
	<input
		class="block mx-auto my-0 w-full p-3 text-lg border-2 border-rose-900 shadow-sharp bg-white outline-none font-heading text-rose-900 placeholder:text-zinc-500"
		id="posts__input"
		type="text"
		placeholder="Find post... (start with # to find tags)"
		autocomplete="off"
		aria-label="search post"
		on:input={filterPost}
		bind:this={inputBox}
	/>
	{#if isCompletionVisible}
		<div
			transition:fly={{ duration: 100, y: -50 }}
			class="absolute top-16 left-0 right-0 z-[5] text-rose-900 bg-white p-2 border-2 border-rose-900 shadow-sharp"
		>
			{#if uniqueTags.length > 0}
				{#each uniqueTags as tag}
					<span
						class="block text-left font-heading text-lg p-2 cursor-pointer transition-property-all ease-out duration-100 hover:(text-white bg-rose-900)"
						on:click={() => {
							tagFilter = [...tagFilter, tag]; // cant use push here
							if (inputBox !== null) inputBox.value = "";
							tagKeyword = "";
							isCompletionVisible = false;
						}}
					>
						{tag.toUpperCase()} • {count[tag]} result{(count[tag] ?? 0) > 1 ? "s" : ""}
					</span>
				{/each}
			{:else}
				<span
					class="block text-left font-heading text-lg p-2 cursor-not-allowed transition-property-all ease-out duration-100"
				>
					No result
				</span>
			{/if}
		</div>
	{/if}
</div>
{#if tagFilter.length > 0}
	<div class="flex items-center gap-4 mt-2 text-zinc-700">
		{#each tagFilter as filter}
			<Tag onClick={() => { tagFilter = tagFilter.filter((x) => x !== filter); }} variant="solid">
				{filter}
			</Tag>
		{/each}
	</div>
{/if}
<div class="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-5 mt-4">
	{#each filteredPosts as post}
		<PostCard
			title={post.title}
			href={`/post/${post.slug}`}
			description={post.description}
			date={post.date}
			tags={post.tags}
		/>
	{/each}
</div>


<script lang="ts">
	import Tag from "~/components/Tag.svelte";
	import { fly } from "svelte/transition";
	import type { Post } from "~/models/post";
	import PostCard from "./PostCard.svelte";

	let inputBox: HTMLInputElement| null = null;
	let keyword = "";
	let tagKeyword = "";
	let tagFilter: string[] = [];
	let isCompletionVisible = false;
	
	let filteredPosts: Post[] = [];
	export let posts: Post[] = [];

	// count available tags and insert it to an object
	// ex: [a, a, b, b, b] -> { a: 2, b: 3 }
	const tags = posts.map((post) => post.tags).flat();
	const count = tags.reduce((acc, curr) => ({ ...acc, [curr]: (acc[curr] || 0) + 1 }), {} as Record<string, number>);
	
	$: filteredPosts = posts.filter((post) => {
		const query = keyword.substring(1).toLowerCase();
	
		const title = post.title.toLowerCase().includes(query);
		const slug = post.slug.toLowerCase().includes(query);
		const tags = tagFilter.every((x) => post.tags.includes(x));
		return (title || slug) && tags;
	});
	$: uniqueTags = [...new Set(tags)].filter((tag) => tag.match(new RegExp(tagKeyword.substring(1))))
	
	function filterPost(event: Event) {
		const inputValue = (event.currentTarget as HTMLInputElement).value
		
		// always reset the completion visibility
		isCompletionVisible = false;
	
		if (!inputValue.match(/^#/)) {
			keyword = inputValue;
			return;
		}
	
		tagKeyword = inputValue;
		isCompletionVisible = true;
	}
	</script>
