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
</style>

<svelte:head>
  <script>
  // set dark mode correctly before everythings get rendered
  // thanks https://github.com/pveyes
  try {
    // prettier-ignore
    const { matches: isDarkMode } = window.matchMedia( "(prefers-color-scheme: dark)")
    let preference

    // prettier-ignore
    if (localStorage.getItem("theme")) preference = localStorage.getItem("theme")
        else preference = isDarkMode ? "dark" : "light"

    // prettier-ignore
    if (preference) document.documentElement.setAttribute("data-theme", preference)
  } catch (err) {
    console.log(err)
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

<script>
import { onMount } from "svelte"
import Navbar from "@/components/Navbar.svelte"
import Footer from "@/components/Footer.svelte"
import Loading from "@/components/Loading.svelte"
import { theme } from "@/utils/theme"
export let segment

onMount(() => {
  const { matches: isDarkTheme } = window.matchMedia(
    "(prefers-color-scheme: dark)"
  )

  let preference

  // prettier-ignore
  if (localStorage.getItem("theme")) preference = localStorage.getItem("theme")
    else preference = isDarkTheme ? "dark" : "light"

  theme.set(preference)

  theme.subscribe(current => {
    localStorage.setItem("theme", current)
    document.documentElement.setAttribute("data-theme", current)
  })
})
</script>
