import { Theme } from "$lib/store/theme";

export function toggleTheme(current: Theme) {
  const opposite = current === Theme.DARK ? Theme.LIGHT : Theme.DARK;
  document.documentElement.classList.add(current);
  document.documentElement.classList.remove(opposite);
}