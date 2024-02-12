<script lang="ts">
	import type { Post } from "~/models/post.ts";
	import PostCard from "~/components/card/PostCard.svelte";
	import FadingVeil from "~/components/FadingVeil.svelte";

	export let posts: Post[];
	let expanded = false;
</script>

<section class="relative pt-10">
	<h2 class="text-2xl font-bold font-serif text-pink-950">Articles</h2>
	<p class="font-serif text-pink-950/70 pt-2 pb-4">
		Even though I don't write often, I try to share my thoughts and experiences from time to time. Hope you find
		them useful!
	</p>
	<FadingVeil {expanded} onClick={() => expanded = !expanded} />
	<div class="relative grid grid-cols-3 gap-3 pb-4">
		{#each posts.slice(0, expanded ? posts.length : 6) as post (post.data.title)}
			<PostCard {...post.data} />
		{/each}
	</div>
</section>