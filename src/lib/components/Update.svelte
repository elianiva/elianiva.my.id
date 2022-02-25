<section
  class="bg-white dark:bg-gray-800 border-1 border-gray-200 dark:border-gray-700 border-l-3 border-l-blue-600 dark:border-l-red-500"
>
  <div
    class="py-2 px-4 bg-gray-200 dark:bg-gray-900 text-slate-600 dark:text-slate-400 font-heading flex items-center justify-between"
  >
    <span class="font-semibold">UPDATE</span>
    <span class="text-slate-500">{formattedDate}</span>
  </div>
  <div
    class="p-4 text-slate-600 dark:text-slate-400 bg-white dark:bg-gray-800 font-lg leading-relaxed"
  >
    <slot />
  </div>
</section>

<script lang="ts">
export let date: string = "";

const dateObj = new Date(date);

const formattedDate = dateObj.toLocaleDateString("en-UK", {
  weekday: "short",
  year: "numeric",
  month: "long",
  day: "numeric",
});
</script>
