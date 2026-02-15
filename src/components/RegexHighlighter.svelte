<script lang="ts">
interface HighlightPattern {
	pattern: string;
	color: string;
	flags?: string;
}

interface Props {
	patterns: HighlightPattern[];
	text: string;
}

let { patterns, text }: Props = $props();

interface Segment {
	text: string;
	color: string | null;
}

interface Line {
	segments: Segment[];
}

function highlightLine(line: string, patterns: HighlightPattern[]): Segment[] {
	if (!patterns.length || !line) return [{ text: line, color: null }];

	// Track ranges with their colors - later patterns override earlier ones
	const ranges: Array<{ start: number; end: number; color: string }> = [];

	for (const { pattern, color, flags } of patterns) {
		const regex = new RegExp(pattern, flags || "g");

		let match = regex.exec(line);
		while (match !== null) {
			if (match[0].length === 0) {
				regex.lastIndex++;
				match = regex.exec(line);
				continue;
			}

			const newStart = match.index;
			const newEnd = match.index + match[0].length;

			for (let i = ranges.length - 1; i >= 0; i--) {
				const r = ranges[i];
				if (r && r.start < newEnd && r.end > newStart) {
					ranges.splice(i, 1);
				}
			}

			ranges.push({ start: newStart, end: newEnd, color });
			match = regex.exec(line);
		}
	}

	ranges.sort((a, b) => a.start - b.start);

	const segments: Segment[] = [];
	let lastEnd = 0;

	for (const range of ranges) {
		if (range.start > lastEnd) {
			segments.push({
				text: line.slice(lastEnd, range.start),
				color: null,
			});
		}

		segments.push({
			text: line.slice(range.start, range.end),
			color: range.color,
		});
		lastEnd = range.end;
	}

	if (lastEnd < line.length) {
		segments.push({ text: line.slice(lastEnd), color: null });
	}

	return segments.length ? segments : [{ text: line, color: null }];
}

function getLines(text: string, patterns: HighlightPattern[]): Line[] {
	const rawLines = text.split("\n");
	return rawLines.map((line) => ({
		segments: highlightLine(line, patterns),
	}));
}

let lines = $derived(getLines(text, patterns));
</script>

<div class="p-3 border-[0.5px] border-[#e8e0d9] rounded-md bg-[#fffaf5] overflow-x-auto mb-6">
	<code class="regex-highlighter before:content-[''] after:content-[''] text-[#443d66]! font-mono! text-sm">
		{#each lines as line}
			<p class="whitespace-nowrap m-0! p-0! leading-relaxed">
				{#each line.segments as segment}
					{#if segment.color}
						<span style="color: {segment.color}">{segment.text}</span>
					{:else}
						{segment.text}
					{/if}
				{/each}
			</p>
		{/each}
	</code>
</div>

<style>
	.regex-highlighter {
		font-family: inherit;
		background: transparent;
		padding: 0;
	}
</style>
