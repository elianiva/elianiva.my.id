<script lang="ts">
import { onMount } from "svelte";

interface GraphNode {
	id: string;
	title: string;
	category: string;
	val?: number;
}

interface GraphLink {
	source: string;
	target: string;
}

interface Props {
	nodes: GraphNode[];
	links: GraphLink[];
}

let { nodes, links }: Props = $props();

let container: HTMLDivElement;
let ForceGraph: any;
let graph: any;

const categoryColors: Record<string, string> = {
	article: "#fbbf24",
	vault: "#7dd3fc",
	person: "#f472b6",
	music: "#c084fc",
};

onMount(async () => {
	const module = await import("force-graph");
	ForceGraph = module.default;

	graph = ForceGraph()(container)
		.graphData({ nodes, links })
		.nodeId("id")
		.nodeLabel("title")
		.nodeColor((node: GraphNode) => categoryColors[node.category] || "#999")
		.nodeVal((node: GraphNode) => node.val || 4)
		.linkDirectionalArrowLength(6)
		.linkDirectionalArrowRelPos(1)
		.linkCurvature(0.25)
		.backgroundColor("rgba(0,0,0,0)")
		.onNodeClick((node: GraphNode) => {
			window.location.href = `/notes/${node.id}`;
		})
		.width(container.clientWidth)
		.height(400);

	// Handle resize
	const resizeObserver = new ResizeObserver((entries) => {
		for (const entry of entries) {
			graph.width(entry.contentRect.width);
		}
	});
	resizeObserver.observe(container);

	return () => {
		resizeObserver.disconnect();
		graph._destructor();
	};
});
</script>

<div bind:this={container} class="w-full h-[400px] rounded-xl border border-dashed border-pink-200 bg-white/40" role="img" aria-label="Note relationship graph">
	{#if !ForceGraph}
		<div class="w-full h-full flex items-center justify-center text-pink-950/50">
			Loading graph...
		</div>
	{/if}
</div>

<style>
	:global(.force-graph-container) {
		cursor: grab;
	}
	:global(.force-graph-container:active) {
		cursor: grabbing;
	}
</style>
