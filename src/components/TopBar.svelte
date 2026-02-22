<script lang="ts">
import { onMount } from "svelte";

interface Props {
	isPost?: boolean;
}

let { isPost = false }: Props = $props();

let progress = $derived(isPost ? 0 : 100);

onMount(() => {
	if (!isPost) return;

	const updateProgress = () => {
		const scrollTop = window.scrollY;
		const docHeight =
			document.documentElement.scrollHeight - window.innerHeight;
		progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
	};

	updateProgress();
	window.addEventListener("scroll", updateProgress, { passive: true });

	return () => {
		window.removeEventListener("scroll", updateProgress);
	};
});
</script>

<div
	class="fixed z-50 top-0 left-0 right-0 h-10"
	style="clip-path: inset(0 calc(100% - {progress}%) 0 0)"
>
	<div class="fixed top-0 left-0 w-full h-2 bg-pink-300"></div>
	<div class="fixed top-0 left-0 w-40 h-4 bg-sky-300"></div>
	<div
		class="fixed top-0 left-0 w-20 h-6 bg-yellow-300 group cursor-pointer flex items-center justify-center transition-transform"
	>
		<a
			href="/notes"
			class="invisible group-hover:visible text-xs text-yellow-700"
		>
			notes
		</a>
	</div>
</div>

<!-- Fake top bar for posts to show the 'shadow' of the actual top bar while it reveals -->
{#if isPost}
	<div class="fixed z-40 top-0 left-0 right-0 h-10">
		<div class="fixed top-0 left-0 w-full h-2 bg-pink-200"></div>
		<div class="fixed top-0 left-0 w-40 h-4 bg-pink-200"></div>
		<div
			class="fixed top-0 left-0 w-20 h-6 bg-pink-200 group cursor-pointer flex items-center justify-center transition-transform"
		></div>
	</div>
{/if}
