import { defineConfig, presetTypography, presetWind4 } from "unocss";
import { theme } from "@unocss/preset-wind4";

export default defineConfig({
	presets: [
		presetWind4(),
		// @ts-expect-error: mismatch between wind4 and mini preset
		presetTypography({
			cssExtend: {
				h1: {
					"font-size": "clamp(1.5rem, 5vw, 2rem)",
					color: theme.colors.pink[950],
				},
				h2: {
					"font-size": "clamp(1.25rem, 5vw, 1.75rem)",
					"margin-block": "1rem",
					color: theme.colors.pink[950],
				},
				h3: {
					"font-size": "clamp(1.125rem, 5vw, 1.5rem)",
					color: theme.colors.pink[950],
				},
				h4: {
					"font-size": "clamp(1rem, 5vw, 1.25rem)",
					color: theme.colors.pink[950],
				},
				p: {
					"text-align": "justify",
					"margin-block": "1rem",
					color: theme.colors.pink[950],
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
