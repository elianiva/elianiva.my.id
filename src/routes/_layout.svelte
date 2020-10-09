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

<Navbar segment={segment} />
<main>
  <div>
    <slot />
  </div>
  <Footer />
</main>

<script>
import Navbar from "../components/Navbar.svelte"
import Footer from "../components/Footer/index.svelte"
export let segment
</script>
