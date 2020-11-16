<style>
.err {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-main-text);
  text-align: center;
  padding: 0 1rem;
}

.err__status {
  font-size: 4rem;
  font-family: "Overpass", sans-serif;
  margin-top: 4rem;
}

.err__msg {
  font-size: 2rem;
  font-family: "Open Sans", sans-serif;
}

.err__url {
  font-weight: 600;
  position: relative;
  display: inline-block;
  color: var(--color-main-accent);
  text-decoration: none;
  transition: all ease-out 0.2s;
}

.err__url::before {
  position: absolute;
  content: "";
  bottom: -0.25rem;
  left: -0.25rem;
  right: -0.25rem;
  top: 0.25rem;
  transform: scale3d(0, 0.1, 1);
  transform-origin: 0 100%;
  background-image: linear-gradient(
    to right,
    var(--color-main-accent),
    rgba(0, 0, 0, 0)
  );
  z-index: -1;
  transition: transform ease-out 0.2s;
}

.err__url:hover::before {
  transform: scale3d(1, 0.1, 1);
}
</style>

<svelte:head>
  <title>{status} | Elianiva's Site</title>
</svelte:head>

<div class="err">
  {#if status === 404}
    <h1 class="err__status">{status}</h1>
    <span class="err__msg">Sorry, you might entered a wrong URL.
      <br />
      Wanna go
      <a class="err__url" href="/">back home?</a>
    </span>
  {:else}
    <span class="err__msg"> Something went wrong. </span>
  {/if}
</div>

{#if dev && error.stack}
  <pre>{error.stack}</pre>
{/if}

<script>
export let status
export let error

// eslint-disable-next-line
const dev = process.env.NODE_ENV === "development"
</script>
