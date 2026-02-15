<script lang="ts">
import { onMount } from "svelte";
import CheckIcon from "~icons/ph/check";
import CopyIcon from "~icons/ph/copy";

onMount(() => {
	const codeBlocks = document.querySelectorAll("pre");

	codeBlocks.forEach((pre) => {
		const wrapper = document.createElement("div");
		wrapper.className = "relative group";

		pre.parentNode?.insertBefore(wrapper, pre);
		wrapper.appendChild(pre);

		const button = document.createElement("button");
		button.className =
			"absolute top-2 right-2 p-2 rounded bg-pink-950/80 text-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-pink-400 hover:bg-pink-900 z-10";
		button.setAttribute("aria-label", "Copy code to clipboard");
		button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256"><path fill="currentColor" d="M216 32H88a8 8 0 0 0-8 8v16H40a8 8 0 0 0-8 8v128a8 8 0 0 0 8 8h128a8 8 0 0 0 8-8v-16h40a8 8 0 0 0 8-8V40a8 8 0 0 0-8-8m-8 144H48V64h16v96a8 8 0 0 0 8 8h136Zm32-32h-24V48H96v-8h144Z"/></svg>`;

		button.addEventListener("click", async () => {
			const code = pre.textContent || "";
			try {
				await navigator.clipboard.writeText(code);
				button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256"><path fill="currentColor" d="m232.5 71.5l-128 128a12.1 12.1 0 0 1-17 0l-56-56a12 12 0 0 1 17-17L96 175L215.5 55.5a12 12 0 0 1 17 17Z"/></svg>`;
				button.classList.add("bg-green-700/80");
				button.classList.remove("bg-pink-950/80");

				setTimeout(() => {
					button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256"><path fill="currentColor" d="M216 32H88a8 8 0 0 0-8 8v16H40a8 8 0 0 0-8 8v128a8 8 0 0 0 8 8h128a8 8 0 0 0 8-8v-16h40a8 8 0 0 0 8-8V40a8 8 0 0 0-8-8m-8 144H48V64h16v96a8 8 0 0 0 8 8h136Zm32-32h-24V48H96v-8h144Z"/></svg>`;
					button.classList.remove("bg-green-700/80");
					button.classList.add("bg-pink-950/80");
				}, 2000);
			} catch (err) {
				console.error("Failed to copy:", err);
			}
		});

		wrapper.appendChild(button);
	});

	return () => {
		codeBlocks.forEach((pre) => {
			const wrapper = pre.parentElement;
			if (wrapper?.classList.contains("group")) {
				const button = wrapper.querySelector("button");
				if (button) button.remove();
				wrapper.parentNode?.insertBefore(pre, wrapper);
				wrapper.remove();
			}
		});
	};
});
</script>
