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
<main class="grid grid-cols-1 md:grid-cols-[5rem_1fr] max-w-[1920px] mx-auto">
  <Navbar />
  <div class="w-full flex flex-col">
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
import "../global.css";

// fonts
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/400-italic.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/400-italic.css";

onMount(() => {
  const { matches: isDarkTheme } = window.matchMedia(
    "(prefers-color-scheme: dark)"
  );

  let preference: Theme;

  // prettier-ignore
  if (localStorage.getItem("theme")) { 
    preference = localStorage.getItem("theme") as Theme
  } else { 
    preference = isDarkTheme ? Theme.DARK : Theme.LIGHT
  }

  theme.set(preference);

  theme.subscribe((current) => {
    localStorage.setItem("theme", current);
    toggleTheme(current);
  });
});
</script>
