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
        strong: {
          color: "var(--un-prose-headings)",
        },
        p: {
          "font-family": "var(--font-sans)",
        },
        h1: {
          "font-size": "1.875rem",
        },
        h2: {
          "font-size": "1.5rem",
        },
        "h1, h2, h3, h4, h5, h6": {
          "font-family": "var(--font-heading)",
        },
        "h1 a, h2 a, h3 a, h4 a, h5 a": {
          "font-weight": 600,
        },
        "h1::after": {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "0.125rem",
        },
      },
    }),
  ],
  transformers: [transformerVariantGroup()],
  rules: [
    [
      /^content-\[(.*)\]$/,
      ([, content]) => ({ content: JSON.stringify(content) }),
    ],
    [
      /prose-custom/,
      () => ({
        "--font-heading": '"Poppins", sans-serif',
        "--font-sans": '"Open Sans", sans-serif',
        "--font-monospace": '"JetBrains Mono", monospace',
        "--un-prose-body": colors.slate[600],
        "--un-prose-invert-body": colors.slate[400],
        "--un-prose-links": colors.slate[700],
        "--un-prose-invert-links": colors.slate[200],
        "--un-prose-headings": colors.slate[700],
        "--un-prose-invert-headings": colors.slate[300],
      }),
      { layer: "typography" },
    ],
  ],
  theme: {
    fontFamily: {
      heading: ["Poppins", "sans-serif"],
      sans: ["Open Sans", "sans-serif"],
      monospace: ["JetBrains Mono", "monospace"],
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
      "sun-rays": `
        0 -0.875rem 0 currentColor,            /* north */
        0.625rem -0.625rem 0 currentColor,   /* north east */
        0.875rem 0 0 currentColor,             /* east */
        0.625rem 0.625rem 0 currentColor,    /* south east */
        0 0.875rem 0 currentColor,             /* south */
        -0.625rem 0.625rem 0 currentColor,   /* south west */
        -0.875rem 0 0 currentColor,            /* west */
        -0.625rem -0.625rem 0 currentColor;  /* north west */`,
    },
    backgroundImage: {
      "red-fading-line": `linear-gradient(to right, ${colors.red[500]}, rgba(0, 0, 0, 0))`,
      "blue-fading-line": `linear-gradient(to right, ${colors.blue[600]}, rgba(0, 0, 0, 0))`,
    },
  },
});
