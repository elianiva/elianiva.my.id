<style>
main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

div {
  flex: 1;
  margin-top: 4rem;
}
</style>

{#if segment !== undefined}
  <Navbar {segment} />
  <main>
    <div>
      <slot />
    </div>
    <Footer />
  </main>
{:else}
  <slot />
{/if}

<script>
import { onMount } from "svelte"
import Navbar from "@/components/Navbar.svelte"
import Footer from "@/components/Footer.svelte"
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
