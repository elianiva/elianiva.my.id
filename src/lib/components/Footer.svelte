<footer
  class="relative mt-12 text-center py-10 px-1 bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-800 transition-[filter_ease-out_0.2s] font-heading"
>
  <div class="grid grid-cols-4 max-w-[220px] mx-auto mb-6">
    {#each social as { icon, url }}
      <a
        class="text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:dark:text-slate-200"
        href={url}
        target="_blank"
        rel="norel noreferrer"
        aria-label={url}
      >
        <svelte:component this={icon} class="w-8 h-8 text-current" />
      </a>
    {/each}
  </div>
  <p class="leading-relaxed text-slate-600 dark:text-slate-400">
    Powered by
    <a
      class="no-underline text-slate-800 dark:text-slate-200"
      href="https://kit.svelte.dev"
    >
      Svelte-Kit
    </a>
    and
    <a
      class="no-underline text-slate-800 dark:text-slate-200"
      href="https://vercel.app"
    >
      Vercel
    </a>
    • Source code is available on
    <a
      class="no-underline text-slate-800 dark:text-slate-200"
      href="{data.github}/elianiva.my.id"
    >
      Github
    </a>
  </p>
  <p class="leading-relaxed text-slate-600 dark:text-slate-400">
    Copyright &copy; {new Date().getFullYear()}
    <a
      class="no-underline text-slate-800 dark:text-slate-200"
      href={data.github}
    >
      Elianiva
    </a>
  </p>
</footer>

<script>
import data from "$lib/data/site";
import EnvelopeIcon from "~icons/ph/envelope";
import GithubIcon from "~icons/ph/github-logo";
import TwitterIcon from "~icons/ph/twitter-logo";
import RSSIcon from "~icons/ph/rss";

const social = [
  { url: data.github, icon: GithubIcon },
  { url: data.twitter, icon: TwitterIcon },
  { url: `mailto:${data.email}`, icon: EnvelopeIcon },
  { url: "/rss.xml", icon: RSSIcon },
];
</script>
