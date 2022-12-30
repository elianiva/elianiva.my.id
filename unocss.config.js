import { transformerVariantGroup, presetTypography } from "unocss";
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
					"background-image": "linear-gradient(var(--c-prose-accent), var(--c-prose-accent))",
					"background-size": "0 2px",
					"background-repeat": "no-repeat",
					"background-position": "bottom left",
					transition: "background-size ease-out 200ms",
				},
				"p > a:hover, li > a:hover": {
					"background-size": "100% 2px",
				},
				strong: {
					color: "var(--un-prose-headings)",
				},
				p: {
					"font-family": "var(--font-serif)",
					"line-height": "1.625",
				},
				h1: {
					"text-transform": "uppercase",
					"font-weight": 700,
					"font-size": "1.875rem",
					"background-image": `linear-gradient(to right, var(--c-prose-accent), rgba(0, 0, 0, 0))`,
					"background-size": "100% 0.125rem",
					"background-repeat": "no-repeat",
					"background-position": "bottom",
					"padding-bottom": "0.5rem",
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
					color: "var(--un-prose-headings)",
					"font-family": "var(--font-monospace)",
					"background-color": "var(--c-prose-alt-bg)",
					"font-weight": 500,
					border: "none",
				},
				pre: {
					"font-family": "var(--font-monospace)",
					padding: "1rem",
					"margin-top": "1.25rem",
					"overflow-x": "auto",
					"scrollbar-color": "var(--un-font-)",
					"border-radius": "0.375rem",
				},
				"pre::-webkit-scrollbar": {
					"background-color": "var(--c-prose-alt-bg)",
					height: "0.5rem",
					"border-bottom-right-radius": "0.375rem",
					"border-bottom-left-radius": "0.375rem",
					cursor: "pointer",
				},
				"pre:hover::-webkit-scrollbar": {
					"background-color": "var(--c-prose-scrollbar-bg)",
					height: "0.5rem",
				},
				"pre::-webkit-scrollbar-thumb": {
					"border-radius": "0.375rem",
					cursor: "pointer",
				},
				"pre:hover::-webkit-scrollbar-thumb": {
					"background-color": "var(--c-prose-thumb-bg)",
				},
				"del, del *": {
					"font-style": "italic",
					"text-decoration": "line-through",
				},
				table: {
					width: "100%",
					"border-radius": "0.375rem",
					"background-color": "var(--c-prose-alt-bg)",
				},
				"table a": {
					transition: "all ease-out 200ms",
					"font-weight": "semibold",
					"line-height": "1.625",
					"font-style": "italic",
				},
				"table th": {
					color: "var(--un-prose-links)",
					"font-size": "1.125rem",
					"text-transform": "uppercase",
				},
				"table td": {
					"text-align": "left",
				},
			},
		}),
	],
	transformers: [transformerVariantGroup()],
	rules: [
		[/^content-\[(.*)\]$/, ([, content]) => ({ content: JSON.stringify(content) })],
		[
			/^prose-custom$/,
			(_, { theme }) => ({
				"--font-heading": '"Space Grotesk", sans-serif',
				"--font-serif": '"IBM Plex Serif", serif',
				"--font-monospace": '"IBM Plex Mono", monospace',
				"--un-prose-body": theme.colors.zinc[800],
				"--un-prose-links": theme.colors.rose[700],
				"--un-prose-headings": theme.colors.zinc[800],
				"--c-prose-accent": theme.colors.rose[600],
				"--c-prose-alt-bg": theme.colors.rose[100],
				"--c-prose-scrollbar-bg": theme.colors.gray[200],
				"--c-prose-thumb-bg": theme.colors.gray[300],
			}),
			{ layer: "typography" },
		],
		[
			/^custom-scrollbar$/,
			(_, { theme }) =>
				`
				html {
					color: ${theme.colors.rose[200]} ${theme.colors.rose[600]};
					scroll-padding-top: 2rem;
				}

				html::-webkit-scrollbar-thumb {
					background-color: ${theme.colors.rose[600]};
				}

				html::-webkit-scrollbar {
					background-color: ${theme.colors.rose[200]};
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
					shadow-sharp border-2 border-rose-900
					hover:(-translate-y-1.5)
				`;
			},
		],
		[
			/^btn-(source|demo)$/,
			([, kind]) => {
				const colour = kind === "demo" ? "bg-rose-600 text-white" : "bg-white text-zinc-900";
				return `${colour} border-2 border-rose-900 shadow-sharp font-heading no-underline flex items-center gap-2 py-1 px-3 transition-property-filter ease-out duration-200 hover:brightness-90`;
			},
		],
	],
	theme: {
		fontFamily: {
			heading: ["Space Grotesk", "sans-serif"],
			serif: ["IBM Plex Serif", "serif"],
			monospace: ["IBM Plex Mono", "monospace"],
		},
		fontSize: {
			"clamped-lg": "clamp(1.25rem, calc(5vw + 1.25rem), 3rem)",
			"clamped-md": "clamp(1rem, calc(5vw + 0.5rem), 1.625rem)",
			"clamped-sm": "clamp(0.8rem, calc(2vw + 0.5rem), 1.125rem)",
		},
		width: {
			clamped: "clamp(12rem, calc(20vw + 4rem), 16rem)",
		},
		height: {
			clamped: "clamp(12rem, calc(20vw + 4rem), 16rem)",
		},
		boxShadow: {
			sharp: `0.25rem 0.25rem 0 0 ${colors.rose[900]}`,
		},
		backgroundImage: {
			"red-fading-line": `linear-gradient(to right, ${colors.red[500]}, rgba(0, 0, 0, 0))`,
			"blue-fading-line": `linear-gradient(to right, ${colors.rose[600]}, rgba(0, 0, 0, 0))`,
		},
	},
	preflights: [
		{
			getCSS: ({ theme }) => `
			*::selection {
				background-color: ${theme.colors.zinc[800]};
				color: ${theme.colors.white};
			}`,
		},
	],
});
