<style>
:global(html) {
  scroll-padding-top: 5rem;
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
    let preference = theme || (isDarkMode ? "dark" : "light");

    // prettier-ignore
    if (preference === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else if (preference === "light") {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark")
    }
  } catch (err) {
    console.error(err);
  }
  </script>
</svelte:head>

<Loading />
<main class="grid grid-cols-1 md:grid-cols-[6rem,1fr] h-full max-w-screen-2xl mx-auto">
  <Navbar {segment} />
  <div class="w-full flex flex-col">
    <div class="flex-1 pt-10">
      <slot />
    </div>
    <Footer />
  </div>
</main>

<script lang="ts">
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

export let segment: string = "";

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
