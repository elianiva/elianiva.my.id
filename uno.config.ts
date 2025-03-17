import { defineConfig, presetTypography, presetWind4 } from "unocss";
import { theme } from "@unocss/preset-wind4";

export default defineConfig({
	presets: [
		presetWind4(),
		presetTypography({
			cssExtend: {
				h1: {
					"font-size": "clamp(1.5rem, 5vw, 2rem)",
					"line-height": "1.2em",
					"text-align": "left",
				},
				h2: {
					"font-size": "clamp(1.25rem, 5vw, 1.75rem)",
					"line-height": "1.2em",
					"text-align": "left",
				},
				h3: {
					"font-size": "clamp(1.125rem, 5vw, 1.5rem)",
					"line-height": "1.2em",
					"text-align": "left",
				},
				h4: {
					"font-size": "clamp(1rem, 5vw, 1.25rem)",
					"line-height": "1.2em",
					"text-align": "left",
				},
				pre: {
					"border-radius": "0.25rem",
					border: `1px solid ${theme.colors.pink[300]}`,
					padding: "0.75rem",
				},
			},
		}),
	],
	theme: {
		font: {
			serif: "'Lora', serif",
			mono: "'IBM Plex Mono', monospace",
		},
	},
});
