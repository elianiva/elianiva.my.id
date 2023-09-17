<script lang="ts">
	import { onDestroy, onMount } from "svelte";

	const ALPHABETS = "abcdefghijklmnopqrstuvwxyz ";
	const cycleDuration = 3000;
	const texts = [
		"Frontend Web Developer",
		"Backend Web Developer",
		"Informatics Engineering Student",
	];

	let interval: NodeJS.Timeout | undefined = undefined;
	let currentTextIndex = 0;

	let displayedText = texts[0];

	function shuffleRandomLettersTo(finalText: string) {
	const cycleDuration = 500;
	const easingFactor = 0.005; // Adjust this value for the desired easing effect
	let startTime: number | null = null;

	function animate(time: number) {
		if (!startTime) startTime = time;
		const progress = Math.min((time - startTime) / cycleDuration, 1); // Ensure progress doesn't exceed 1
		const easedProgress = 1 - Math.pow(1 - progress, easingFactor); // Apply easing

		displayedText = finalText
		.split('')
		.map((letter) => letter === " " ? " " : ALPHABETS[Math.floor(Math.random() * ALPHABETS.length)])
		.join('');

		if (easedProgress < 1) {
			requestAnimationFrame(animate);
		} else {
			displayedText = finalText;
		}
	}

  requestAnimationFrame(animate);
}

	onMount(() => {
		interval = setInterval(() => {
			currentTextIndex = (currentTextIndex + 1) % texts.length;
			shuffleRandomLettersTo(texts[currentTextIndex]!);
		}, cycleDuration);
	});

	onDestroy(() => {
		if (interval !== undefined) {
			clearInterval(interval);
		}
	});
</script>

<div class="bg-black text-white inline-block px-3 py-1 lg:px-6 lg:py-3 mt-4">
	<span class="font-heading text-lg lg:text-2xl font-bold block whitespace-nowrap">{displayedText}</span>
</div>
