<SEO title="About" />

<h1>About this site</h1>

<p>This is the 'about' page. There's not much here.</p>

<script>
  import { onMount } from "svelte"
  import SEO from "@/components/SEO.svelte"

  // use `requestAnimationFrame` because we need to wait
  // for the next DOM update, otherwise it woudn't work
  onMount(() => requestAnimationFrame(() => window.scrollTo(0, 0)))
</script>
