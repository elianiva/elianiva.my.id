import { defineConfig } from "unocss/vite";
import { presetWind, presetTypography } from "unocss";
import { colors } from "unocss/preset-wind"

export default defineConfig({
	presets: [presetWind(), presetTypography({
		cssExtend: {
			"h1": {
				"font-size": "clamp(1.5rem, 5vw, 2rem)",
				"line-height": "1.2em",
				"text-align": "left"
			},
			"h2": {
				"font-size": "clamp(1.25rem, 5vw, 1.75rem)",
				"line-height": "1.2em",
				"text-align": "left"
			},
			"h3": {
				"font-size": "clamp(1.125rem, 5vw, 1.5rem)",
				"line-height": "1.2em",
				"text-align": "left"
			},
			"h4": {
				"font-size": "clamp(1rem, 5vw, 1.25rem)",
				"line-height": "1.2em",
				"text-align": "left"
			},
			"pre": {
				"border-radius": "0.25rem",
				"border": `1px solid ${colors.pink[300]}`,
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
