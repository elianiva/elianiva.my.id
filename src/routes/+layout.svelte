<style global>
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

html,
body,
#svelte {
	height: 100%;
	height: 100%;
}
</style>

<svelte:head>
	<script>
	// set dark mode correctly before everythings get rendered
	// thanks https://github.com/pveyes
	try {
		// prettier-ignore
		const { matches: isDarkMode } = window.matchMedia( "(prefers-color-scheme: dark)")

		const theme = localStorage.getItem("theme");
		const current = theme || (isDarkMode ? "dark" : "light");
		const opposite = current === "dark" ? "light" : "dark";

		document.documentElement.classList.add(current);
		document.documentElement.classList.remove(opposite);
	} catch (err) {
		console.error(err);
	}
	</script>
</svelte:head>

<Loading />
<main class="custom-scrollbar h-full grid grid-cols-1 md:grid-cols-[5rem_1fr] max-w-[1920px] mx-auto">
	<Navbar />
	<div class="w-full h-full flex flex-col">
		<div class="flex-1 pt-10">
			<slot />
		</div>
		<Footer />
	</div>
</main>

<script lang="ts">
import "uno.css";
import "@unocss/reset/tailwind.css";

import { onMount } from "svelte";
import Navbar from "$lib/components/Navbar.svelte";
import Footer from "$lib/components/Footer.svelte";
import Loading from "$lib/components/Loading.svelte";
import { toggleTheme } from "$lib/utils/theme";
import { theme, Theme } from "$lib/store/theme";

// fonts
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/400-italic.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/400-italic.css";

onMount(() => {
	const { matches: isDarkMode } = window.matchMedia("(prefers-color-scheme: dark)");
	const current = (localStorage.getItem("theme") as Theme) || (isDarkMode ? Theme.DARK : Theme.LIGHT);
	theme.set(current);
	theme.subscribe((current) => {
		localStorage.setItem("theme", current);
		toggleTheme(current);
	});
});
</script>
