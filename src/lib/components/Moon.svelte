<style>
.moon {
  position: relative;
  width: 1.25rem;
  height: 1.25rem;
  border: 0.15rem var(--color-alt-text) solid;
  border-radius: 50%;
  clip-path: circle(50% at 50% 50%);
  z-index: 1;
}

.moon__small {
  position: absolute;
  bottom: 0.25rem;
  left: 0.25rem;
  width: 1.25rem;
  height: 1.25rem;
  border: 0.15rem var(--color-alt-text) solid;
  border-radius: 50%;
  background-color: var(--color-main-bg);
  z-index: 2;
  transition: bottom ease-out 0.2s, left ease-out 0.2s;
}

.button {
  border: none;
  background: none;
  outline: none;
  display: flex;
  align-items: center;
  color: var(--color-main-text);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>

<button
  class="button"
  on:click={() => toggleDarkMode()}
  aria-label="toggle darkmode"
>
  <div class="moon">
    <div
      class="moon__small"
      style={`left: ${$theme === "dark" ? "0.25rem" : "0.75rem"}; bottom: ${
        $theme === "dark" ? "0.25rem" : "0.75rem"
      };`}
    />
  </div>
</button>

<script>
import { theme } from "$lib/utils/theme";

const toggleDarkMode = () => {
  theme.update(current => (current === "light" ? "dark" : "light"));
};
</script>
