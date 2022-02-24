<nav
  class="sticky bottom-0 left-0 right-0 md:static md:w-full h-6rem bg-gray-50 dark:bg-gray-900 z-30 border-r border-gray-300 dark:border-gray-800"
>
  <div
    class="fixed h-screen flex flex-col items-center justify-center max-w-screen-lg mx-auto px-4"
  >
    <ul class="list-none flex flex-col gap-10 items-center justify-center">
      {#each routes as r}
        <li>
          <a
            class="relative flex flex-col gap-1 items-center justify-center hover:text-slate-700 hover:dark:text-slate-300 text-lg leading-relaxed no-underline font-sans transition-[color] duration-100 ease-out {r.path ===
            segment
              ? 'text-slate-700 dark:text-slate-300'
              : 'text-slate-400 dark:text-slate-600'}"
            href={r.path}
          >
            <svelte:component this={r.icon} class="w-6 h-6" />
            <span class="text-sm font-light">{r.name}</span>
          </a>
        </li>
      {/each}
      <hr class="border-gray-300 dark:border-gray-800 h-1 w-full" />
      <li>
        <Moon />
      </li>
    </ul>
  </div>
</nav>

<script lang="ts">
import Moon from "$lib/components/Moon.svelte";
import HomeIcon from "~icons/ph/house-fill";
import PostIcon from "~icons/ph/newspaper-fill";
import AboutIcon from "~icons/ph/user-circle-fill";
import ProjectIcon from "~icons/ph/browser-fill";

export let segment: string;

const routes = [
  { name: "Home", path: "/", icon: HomeIcon },
  { name: "Post", path: "/post", icon: PostIcon },
  { name: "Project", path: "/project", icon: ProjectIcon },
  { name: "About", path: "/about", icon: AboutIcon },
];
</script>
