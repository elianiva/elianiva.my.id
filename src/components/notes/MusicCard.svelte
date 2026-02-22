<script lang="ts">
	interface Props {
		id: string;
		title: string;
		artist?: string;
		album?: string;
		year?: string[];
		tags: string[];
		description?: string;
	}

	let props: Props = $props();
	// svelte-ignore state_referenced_locally
	let { id, title, artist, album, year = [], description = "-" } = props;

	const displayYear =
		year.length > 1 ? `${year[0]}-${year[year.length - 1]}` : year[0];
</script>

<article class="group" style="view-transition-name: note-card-{id}">
	<a
		href={`/notes/${id}`}
		class="flex items-center gap-3 p-3 rounded-xl border border-dashed border-purple-200 bg-white/40 hover:bg-white/60 transition-colors duration-200"
	>
		<!-- album art placeholder -->
		<div
			class="shrink-0 w-12 h-12 rounded-lg bg-purple-100/70 border border-dashed border-purple-200 flex items-center justify-center group-hover:bg-purple-100 transition-colors"
		>
			<svg
				class="w-5 h-5 text-purple-400"
				fill="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path
					d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6zm-2 16a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
				/>
			</svg>
		</div>

		<div class="flex-1 min-w-0">
			<h3
				class="font-display text-sm font-semibold text-pink-950 group-hover:text-purple-700 transition-colors truncate leading-snug"
			>
				{title}
			</h3>
			{#if artist}
				<p class="text-xs text-pink-950/60 mt-0.5 truncate">{artist}</p>
			{/if}
			{#if description}
				<p class="text-xs text-pink-950/40 truncate">{description}</p>
			{/if}
		</div>

		{#if displayYear}
			<span
				class="shrink-0 text-xs font-mono text-purple-400 self-start pt-0.5"
			>
				{displayYear}
			</span>
		{/if}
	</a>
</article>
