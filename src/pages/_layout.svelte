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
import Navbar from "../components/Navbar.svelte"
import Footer from "../components/Footer.svelte"
export let segment
</script>
