<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { tweened } from "svelte/motion";

	function random(min: number, max: number) {
		return Math.floor(min + Math.random() * (max - min)); // Math.round?
	}

	type BlobRadius = {
		rotation: number;
		r1: [number, number];
		r2: [number, number];
		r3: [number, number];
		r4: [number, number];
		scale: number;
	};
	const initialBlob = generateRandomBlobPath();
	let blob = tweened<BlobRadius>(initialBlob, { duration: 1000 });
	function generateRandomBlobPath(previous?: BlobRadius): BlobRadius {
		const r1 = random(25, 75);
		const r2 = random(25, 75);
		const r3 = random(25, 75);
		const r4 = random(25, 75);
		const r11 = 100 - r1;
		const r22 = 100 - r2;
		const r33 = 100 - r3;
		const r44 = 100 - r4;

		return {
			rotation: previous !== undefined ? previous.rotation + 40 : random(0, 360),
			r1: [r1, r11],
			r2: [r2, r22],
			r3: [r3, r33],
			r4: [r4, r44],
			scale: random(0.8, 1.5),
		};
	}

	function animateBlob() {
		blob.update((prev) => generateRandomBlobPath(prev));
	}

	let blobAnimationInterval: NodeJS.Timeout;
	let cursorPosition = tweened<{ x: number; y: number }>(
		{ x: 0, y: 0 },
		// bounce out easing
		{ duration: 500, easing: (t) => t * (2 - t) }
	);
	function updateCursorPosition(event: MouseEvent) {
		cursorPosition.set({ x: event.clientX, y: event.clientY });
	}
	onMount(() => (blobAnimationInterval = setInterval(animateBlob, 1000)));
	onDestroy(() => clearInterval(blobAnimationInterval));

	let isCursorInside = false;
</script>

<svelte:body
	on:mousemove={updateCursorPosition}
	on:mouseleave={() => (isCursorInside = false)}
	on:mouseenter={() => (isCursorInside = true)}
/>

<div
	class="fixed w-50 h-50 bg-white z-100 mix-blend-exclusion pointer-events-none"
	style="
		opacity: {isCursorInside ? 1 : 0};
		transition: opacity 0.5s;
		left: {$cursorPosition.x}px;
		top: {$cursorPosition.y}px;
		border-radius: {$blob.r1[0]}% {$blob.r1[1]}% {$blob.r2[1]}% {$blob.r2[0]}% / {$blob.r3[0]}% {$blob.r4[0]}% {$blob
		.r4[1]}% {$blob.r3[1]}%;
		transform: translate(-50%, -50%);
	"
/>
