<style>
.circle {
  @apply flex items-center justify-center;
}

.circle::after {
  content: "";
  @apply absolute w-[0.4rem] h-[0.4rem] rounded-full shadow-sun-rays transition-[all] duration-300 ease-in-out;
}

.inner-circle {
  @apply rounded-full w-6 h-6 transition-[transform] duration-300 ease-in-out;
}

.inner-circle::before {
  content: "";
  @apply absolute w-8 h-8 rounded-full transition-[scale] duration-200 ease-in-out;
}

.circle.light .inner-circle {
  @apply transform-gpu scale-100;
}

.circle.dark .inner-circle {
  @apply transform-gpu scale-50;
}

.circle.light .inner-circle::before {
  @apply -top-4 -right-4;
}

.circle.dark .inner-circle::before {
  @apply -top-8 -right-8;
}

.circle.light::after {
  @apply transform-gpu scale-0;
}

.circle.dark::after {
  @apply transform-gpu scale-100;
}
</style>

<div
  class="relative w-8 h-8 border-none outline-none flex items-center justify-center cursor-pointer z-10"
  on:click={toggleDarkMode}
>
  <div class="circle {$theme}" id="icon">
    <div
      class="inner-circle bg-slate-400 dark:bg-slate-600 before:bg-gray-50 before:dark:bg-gray-900"
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
