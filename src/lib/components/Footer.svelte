<style>
footer {
  position: relative;
  margin-top: 3rem;
  font-family: var(--font-heading);
  text-align: center;
  padding: 2rem 1rem;
  background-color: var(--color-main-bg);
  filter: opacity(0.5);
  transition: filter ease-out 0.2s;
}

footer:hover {
  filter: opacity(1);
}

footer::before {
  content: "";
  position: absolute;
  top: 0;
  height: 0.125rem;
  left: 4rem;
  right: 4rem;
  background-image: linear-gradient(
    to right,
    #00000000,
    var(--color-borders),
    #00000000
  );
}

p {
  line-height: 1.5em;
  color: var(--color-main-text);
}

a {
  text-decoration: none;
}

.hl {
  color: var(--color-shine);
}

.icons {
  margin: 0 auto 0.5rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  max-width: 220px;
}

.icons a {
  color: var(--color-shine);
  transition: color ease-out 0.2s;
}
.icons a:hover {
  color: var(--color-main-accent);
}
</style>

<footer>
  <div class="icons">
    <!-- prettier-ignore -->
    <a href="mailto:{email}" target="_blank" rel="norel noreferrer" aria-label="email">
      <Email height="24" width="24" />
    </a>
    <!-- prettier-ignore -->
    <a href="{github}" target="_blank" rel="norel noreferrer" aria-label="github">
      <Github height="24" width="24" />
    </a>
    <!-- prettier-ignore -->
    <a href={twitter} target="_blank" rel="norel noreferrer" aria-label="twitter" >
      <Twitter height="24" width="24" />
    </a>
    <!-- prettier-ignore -->
    <a href="/rss.xml" rel="alternate" type="application/rss+xml" aria-label="rss">
      <RSS height="24" width="24" />
    </a>
  </div>
  <p>
    Powered by
    <a class="hl" href="https://kit.svelte.dev">Svelte-Kit</a>
    and
    <a class="hl" href="https://vercel.app">Vercel</a>
    • Source code is available on
    <a class="hl" href="{github}/elianiva.my.id">Github</a>
  </p>
  <p>Copyright &copy; 2020 <a class="hl" href={github}>Elianiva</a></p>
</footer>

<script>
import data from "$lib/data/site";
import Email from "$lib/icons/Email.svelte";
import Github from "$lib/icons/Github.svelte";
import Twitter from "$lib/icons/Twitter.svelte";
import RSS from "$lib/icons/Rss.svelte";

const { github, twitter, email } = data;
</script>
