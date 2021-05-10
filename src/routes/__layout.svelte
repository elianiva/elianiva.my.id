<style>
main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

div {
  flex: 1;
  margin-top: 4.5rem;
}

:global(html) {
  scroll-padding-top: 4.5rem;
}
</style>

<svelte:head>
  <script>
  // set dark mode correctly before everythings get rendered
  // thanks https://github.com/pveyes
  try {
    // prettier-ignore
    const { matches: isDarkMode } = window.matchMedia( "(prefers-color-scheme: dark)")
    let preference;

    if (localStorage.getItem("theme"))
      preference = localStorage.getItem("theme");
    else preference = isDarkMode ? "dark" : "light";

    // prettier-ignore
    if (preference) document.documentElement.setAttribute("data-theme", preference)
  } catch (err) {
    console.log(err);
  }
  </script>
</svelte:head>

<Navbar {segment} />
<main>
  <Loading />
  <div>
    <slot />
  </div>
  <Footer />
</main>

<script lang="ts">
import { onMount } from "svelte";
import Navbar from "$lib/components/Navbar.svelte";
import Footer from "$lib/components/Footer.svelte";
import Loading from "$lib/components/Loading.svelte";
import { theme } from "$lib/utils/theme";

export let segment: string = "";

onMount(() => {
  const { matches: isDarkTheme } = window.matchMedia(
    "(prefers-color-scheme: dark)"
  );

  type Theme = "dark" | "light";
  let preference: Theme;

  // prettier-ignore
  if (localStorage.getItem("theme")) preference = localStorage.getItem("theme") as Theme
  else preference = isDarkTheme ? "dark" : "light"

  theme.set(preference);

  theme.subscribe(current => {
    localStorage.setItem("theme", current);
    document.documentElement.setAttribute("data-theme", current);
  });
});
</script>
