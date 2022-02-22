<button
  class="transparent-tap border-none bg-none outline-none flex items-center cursor-pointer bg-slate-400 dark:bg-slate-600 rounded-full"
  on:click={toggleDarkMode}
  aria-label="toggle darkmode"
>
  <div class="clip-circle relative w-5 h-5 rounded-full z-[1]">
    <div
      class="absolute w-5 h-5 rounded-full z-[2] bg-slate-100 dark:bg-slate-900 transition-[bottom_ease-out_0.2s] transition-[left_ease-out_0.2s] {$theme ===
      Theme.DARK
        ? 'left-[0.4rem] bottom-[0.4rem]'
        : 'left-4 bottom-4'}"
    />
  </div>
</button>

<script>
import { Theme, theme } from "$lib/store/theme";

const toggleDarkMode = () => {
  theme.update((current) =>
    current === Theme.LIGHT ? Theme.DARK : Theme.LIGHT
  );
};
</script>
