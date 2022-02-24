<div
  class="relative w-8 h-8 border-none outline-none flex items-center justify-center cursor-pointer z-10 text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300"
  on:click={toggleDarkMode}
>
  <div
    class="flex items-center after:(content-[] absolute w-[0.4rem] h-[0.4rem] rounded-full shadow-sun-rays transition-property-transform duration-300 ease-in-out) justify-center 
    {$theme === Theme.DARK
      ? 'after:(transform-gpu scale-100)'
      : 'after:(transform-gpu scale-0)'}"
    id="icon"
  >
    <div
      class="rounded-full w-6 h-6 transition-property-transform duration-300 ease-in-out bg-current before:bg-gray-50 before:dark:bg-gray-900 before:(content-[] absolute w-8 h-8 rounded-full transition-property-transform duration-200 ease-in-out) 
      {$theme === Theme.DARK
        ? 'before:(-top-8 -right-8) transform-gpu scale-50'
        : 'before:(-top-4 -right-4) transform-gpu scale-100'}"
    />
  </div>
</div>

<script>
import { Theme, theme } from "$lib/store/theme";

const toggleDarkMode = () => {
  theme.update((current) =>
    current === Theme.LIGHT ? Theme.DARK : Theme.LIGHT
  );
};
</script>
