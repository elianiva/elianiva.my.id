<style>
main {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 4rem);
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
