import { defineConfig } from "unocss/vite";
import { presetWind, presetTypography } from "unocss";

export default defineConfig({
	presets: [presetWind(), presetTypography({
		cssExtend: {
			"h1": {
				"font-size": "2rem",
				"line-height": "1.2"
			},
			"h2": {
				"font-size": "1.75rem",
				"line-height": "1.2"
			},
			"h3": {
				"font-size": "1.5rem",
				"line-height": "1.2"
			},
			"h4": {
				"font-size": "1.25rem",
				"line-height": "1.2"
			},
			"pre": {
				"border-radius": "0.25rem",
			}
		}
	})],
	theme: {
		fontFamily: {
			serif: "'Lora', serif",
			mono: "'IBM Plex Mono', monospace",
		}
	}
});
