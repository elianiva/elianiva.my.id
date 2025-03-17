<script lang="ts">
import PostCard from "~/components/card/PostCard.svelte";
import type { Post } from "~/models/post.ts";

export let posts: Post[];
</script>

<section class="relative pt-10">
	<h2 class="text-xl md:text-2xl font-bold font-serif text-pink-950">Blog</h2>
	<p class="text-sm md:text-base font-serif text-pink-950/70 pt-2 pb-4">
		Even though I don't write often, I try to share my thoughts and experiences from time to time. Hope you find
		them useful!
	</p>
	<div class="relative grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3 pb-4">
		{#each posts.slice(0, 6) as post (post.data.title)}
			<PostCard {...post.data} href="/posts/{post.slug}" />
		{/each}
	</div>
	<a href="/posts" class="uppercase font-mono text-pink-950 hover:text-pink-800 transition-colors text-sm">
		&#8213 See more
	</a>
</section>