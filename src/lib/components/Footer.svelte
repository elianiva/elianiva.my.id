<style>
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

<footer
  class="relative mt-12 text-center py-2 px-1 bg-gray-100 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-800 transition-[filter_ease-out_0.2s] font-heading"
>
  <div class="icons">
    <!-- prettier-ignore -->
    <a href="mailto:{email}" target="_blank" rel="norel noreferrer" aria-label="email">
      <EnvelopeIcon height="24" width="24" />
    </a>
    <!-- prettier-ignore -->
    <a href="{github}" target="_blank" rel="norel noreferrer" aria-label="github">
      <GithubIcon height="24" width="24" />
    </a>
    <!-- prettier-ignore -->
    <a href={twitter} target="_blank" rel="norel noreferrer" aria-label="twitter" >
      <TwitterIcon height="24" width="24" />
    </a>
    <!-- prettier-ignore -->
    <a href="/rss.xml" rel="alternate" type="application/rss+xml" aria-label="rss">
      <RSSIcon height="24" width="24" />
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
  <p>
    Copyright &copy; {new Date().getFullYear()}
    <a class="hl" href={github}>Elianiva</a>
  </p>
</footer>

<script>
import data from "$lib/data/site";
import EnvelopeIcon from "~icons/ph/envelope";
import GithubIcon from "~icons/ph/github-logo";
import TwitterIcon from "~icons/ph/twitter-logo";
import RSSIcon from "~icons/ph/rss";

const { github, twitter, email } = data;
</script>
