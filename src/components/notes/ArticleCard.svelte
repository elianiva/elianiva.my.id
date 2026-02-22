<script lang="ts">
	interface Props {
		id: string;
		title: string;
		description?: string;
		tags: string[];
		created_at: string;
		url?: string;
		author?: string;
	}

	let props: Props = $props();
	// svelte-ignore state_referenced_locally
	let { id, title, description, tags, created_at, url, author } = props;

	const date = new Date(created_at).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	const domain = url ? new URL(url).hostname.replace(/^www\./, "") : "";
	const displayTags = tags
		.filter((t) => t !== "public" && t !== "article")
		.slice(0, 3);
</script>

<article class="group" style="view-transition-name: note-card-{id}">
	<a
		href={`/notes/${id}`}
		class="flex gap-2 rounded-xl border-[0.5px] border-pink-200 bg-white/40 hover:bg-white/60 transition-colors duration-200 overflow-hidden"
	>
		<!-- bocchi hairtie -->
		<div
			class="
			relative w-3 h-full bg-sky-300
			before:content-[''] before:absolute before:left-3 before:top-4 before:size-3 before:rounded-sm before:bg-sky-300/60
			after:content-[''] after:absolute after:left-3 after:top-8 after:size-3 after:rounded-sm after:bg-yellow-300/60
			"
		></div>

		<div class="flex-1 p-3 min-w-0">
			<h3
				class="font-display text-base font-semibold text-pink-950 group-hover:text-sky-700 transition-colors leading-snug"
			>
				{title}
			</h3>
			{#if description}
				<p class="text-sm text-pink-950/60 mt-1 line-clamp-2">
					{description}
				</p>
			{/if}

			<div
				class="flex flex-wrap items-center gap-2 mt-3 text-xs text-pink-950/50"
			>
				{#if domain}
					<span
						class="px-2 py-0.5 rounded-full bg-sky-100/70 text-sky-800 font-medium"
						>{domain}</span
					>
				{/if}
				{#if author}
					<span class="text-pink-950/60">{author}</span>
					<span>·</span>
				{/if}
				<time datetime={created_at}>{date}</time>
				{#if displayTags.length > 0}
					<span>·</span>
					<span class="truncate"
						>{displayTags.map((t) => `#${t}`).join(" ")}</span
					>
				{/if}
			</div>
		</div>
	</a>
</article>
