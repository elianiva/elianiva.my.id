<style>
main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main div {
  flex: 1;
  margin-top: 4rem;
}
</style>

{#if segment !== undefined}
  <Navbar segment={segment} />
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
import { darkTheme } from "@/utils/theme"
export let segment

onMount(() => {
  const preference = localStorage.getItem("darkmode") || 'light'
  darkTheme.set(preference)

  darkTheme.subscribe(current => {
    localStorage.setItem("darkmode", current)
    document.documentElement.setAttribute("data-theme", current)
  })
})
</script>
