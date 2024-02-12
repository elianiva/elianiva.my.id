import { defineConfig } from "unocss/vite";
import { presetWind, presetTypography } from "unocss";
import { presetScrollbar } from "unocss-preset-scrollbar";

export default defineConfig({
	presets: [presetWind(), presetTypography()],
	theme: {
		fontFamily: {
			serif: "'Lora', serif",
			mono: "'IBM Plex Mono', monospace",
		}
	}
});
