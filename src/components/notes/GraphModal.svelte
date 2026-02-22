<script lang="ts">
import { onMount } from "svelte";

interface Node {
	id: string;
	title: string;
	category: string;
	val: number;
}

interface Link {
	source: string;
	target: string;
}

interface Props {
	nodes: Node[];
	links: Link[];
}

let { nodes, links }: Props = $props();

let isOpen = $state(false);
let modalRef: HTMLDivElement | undefined = $state(undefined);

export function open() {
	isOpen = true;
	document.body.style.overflow = "hidden";
}

export function close() {
	isOpen = false;
	document.body.style.overflow = "";
}

function handleBackdropClick(e: MouseEvent) {
	if (e.target === modalRef) {
		close();
	}
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape" && isOpen) {
		close();
	}
}

onMount(() => {
	document.addEventListener("keydown", handleKeydown);
	return () => {
		document.removeEventListener("keydown", handleKeydown);
	};
});
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={modalRef}
		onclick={handleBackdropClick}
		class="fixed inset-0 z-50 bg-pink-950/30 backdrop-blur-sm flex items-center justify-center p-4"
	>
		<div
			class="w-full max-w-5xl h-[80vh] bg-white/95 rounded-2xl border border-dashed border-pink-200 shadow-2xl flex flex-col overflow-hidden"
			role="dialog"
			aria-modal="true"
			aria-labelledby="graph-modal-title"
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-dashed border-pink-200">
				<h2 id="graph-modal-title" class="font-display text-xl font-bold text-pink-950">
					Notes Graph
				</h2>
				<button
					onclick={close}
					class="p-2 rounded-lg text-pink-950/60 hover:text-pink-950 hover:bg-pink-100/50 transition-colors"
					aria-label="Close graph"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Graph Container -->
			<div class="flex-1 relative">
				{#await import('./GraphView.svelte') then { default: GraphView }}
					<GraphView {nodes} {links} client:visible />
				{/await}
			</div>
		</div>
	</div>
{/if}
