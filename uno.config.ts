import { transformerVariantGroup, presetTypography, transformerDirectives } from "unocss";
import { defineConfig } from "unocss/vite";
import { colors, presetWind } from "@unocss/preset-wind";

export default defineConfig({
	presets: [
		presetWind(),
		presetTypography({
			cssExtend: {
				a: {
					"text-decoration": "none",
				},
				"p > a, li > a": {
					position: "relative",
					display: "inline-block",
					"z-index": 5,
					"background-image": "linear-gradient(var(--c-pslate-accent), var(--c-pslate-accent))",
					"background-size": "0 2px",
					"background-repeat": "no-repeat",
					"background-position": "bottom left",
					transition: "background-size ease-out 200ms",
				},
				"p > a:hover, li > a:hover": {
					"background-size": "100% 2px",
				},
				strong: {
					color: "var(--un-pslate-headings)",
				},
				p: {
					"font-family": "var(--font-sans)",
					"line-height": "1.625",
				},
				h1: {
					"text-transform": "uppercase",
					"font-weight": 600,
					"font-size": "1.875rem",
					"padding": "0.5rem 1rem",
					"background-color": "black",
					"display": "inline-block",
					"color": "white",
					"margin": "0.5rem 0",
				},
				h2: {
					"font-size": "1.5rem",
				},
				h3: {
					"font-size": "1.25rem",
				},
				h4: {
					"font-size": "1.125rem",
				},
				"h1, h2, h3, h4, h5, h6": {
					"font-family": "var(--font-heading)",
					position: "relative",
				},
				"h1 a, h2 a, h3 a, h4 a, h5 a": {
					"font-weight": 600,
				},
				"p > code": {
					color: "var(--un-pslate-headings)",
					"font-family": "var(--font-monospace)",
					"background-color": "var(--c-pslate-alt-bg)",
					"font-weight": 500,
					border: "none",
				},
				pre: {
					"font-family": "var(--font-monospace)",
					padding: "1rem",
					"margin-top": "1.25rem",
					"overflow-x": "auto",
					"scrollbar-color": "var(--un-font-)",
				},
				"pre::-webkit-scrollbar": {
					"background-color": "var(--c-pslate-alt-bg)",
					height: "0.5rem",
					"border-bottom-right-radius": "0.375rem",
					"border-bottom-left-radius": "0.375rem",
					cursor: "pointer",
				},
				"pre:hover::-webkit-scrollbar": {
					"background-color": "var(--c-pslate-scrollbar-bg)",
					height: "0.5rem",
				},
				"pre::-webkit-scrollbar-thumb": {
					"border-radius": "0.375rem",
					cursor: "pointer",
				},
				"pre:hover::-webkit-scrollbar-thumb": {
					"background-color": "var(--c-pslate-thumb-bg)",
				},
				"del, del *": {
					"font-style": "italic",
					"text-decoration": "line-through",
				},
				table: {
					width: "100%",
					"background-color": "var(--c-pslate-alt-bg)",
				},
				"table a": {
					transition: "all ease-out 200ms",
					"font-weight": "semibold",
					"line-height": "1.625",
					"font-style": "italic",
				},
				"table th": {
					color: "var(--un-pslate-links)",
					"font-size": "1.125rem",
					"text-transform": "uppercase",
				},
				"table td": {
					"text-align": "left",
				},
			},
		}),
	],
	transformers: [transformerVariantGroup(), transformerDirectives()],
	rules: [
		[/^content-\[(.*)\]$/, ([, content]) => ({ content: JSON.stringify(content) })],
		[
			/^pslate-custom$/,
			(_, { theme }) => ({
				"--font-heading": '"Jost", sans-serif',
				"--font-serif": '"IBM Plex Serif", serif',
				"--font-sans": '"Inter", sans-serif',
				"--font-monospace": '"IBM Plex Mono", monospace',
				"--un-pslate-body": theme.colors.slate[900],
				"--un-pslate-links": theme.colors.slate[700],
				"--un-pslate-headings": theme.colors.slate[900],
				"--c-pslate-accent": theme.colors.slate[600],
				"--c-pslate-alt-bg": theme.colors.slate[100],
				"--c-pslate-scrollbar-bg": theme.colors.gray[200],
				"--c-pslate-thumb-bg": theme.colors.gray[300],
			}),
			{ layer: "typography" },
		],
		[
			/^custom-scrollbar$/,
			(_, { theme }) =>
				`
				html {
					scroll-padding-top: 2rem;
				}

				html::-webkit-scrollbar-thumb {
					background-color: ${theme.colors.slate[600]};
				}

				html::-webkit-scrollbar {
					background-color: ${theme.colors.slate[200]};
					width: 0.5rem;
				}`.replace(/(\s)/g, ""),
			{ layer: "default" },
		],
	],
	shortcuts: [
		[
			/^btn-lg-(.*)$/,
			([, c]) => {
				return `bg-${c} inline-block
					mt-8 px-5 py-2
					text-white font-semibold no-underline font-heading text-lg tracking-wide
					transition-property-transform ease-out duration-200 transform-gpu
					shadow-sharp border-solid border-2 border-slate-900
					hover:(-translate-y-1.5)
				`;
			},
		],
		[
			/^btn-(source|demo)$/,
			([, kind]) => {
				const colour = kind === "demo" ? "bg-slate-600 text-white" : "bg-white text-slate-900";
				return `${colour} border-solid border-2 border-slate-900 shadow-sharp font-heading no-underline flex items-center gap-2 py-1 px-3 transition-property-filter ease-out duration-200 hover:brightness-90`;
			},
		],
	],
	theme: {
		fontFamily: {
			heading: '"Jost", sans-serif',
			sans: '"Inter", sans',
			serif: '"IBM Plex Serif", "serif"',
			monospace: '"IBM Plex Mono", "monospace"',
		},
		fontSize: {
			"clamped-lg": "clamp(1.25rem, calc(5vw + 1.25rem), 4rem)",
			"clamped-md": "clamp(1rem, calc(5vw + 0.5rem), 1.625rem)",
			"clamped-sm": "clamp(1rem, calc(2vw + 0.5rem), 1.25rem)",
		},
		width: {
			clamped: "clamp(12rem, calc(20vw + 4rem), 16rem)",
		},
		height: {
			clamped: "clamp(12rem, calc(20vw + 4rem), 16rem)",
		},
		boxShadow: {
			sharp: `0.25rem 0.25rem 0 0 ${colors.slate[900]}`,
		},
	},
	preflights: [
		{
			getCSS: ({ theme }) => `
			*::selection {
				background-color: ${theme.colors.slate[900]};
				color: ${theme.colors.white};
			}`,
		},
	],
});
