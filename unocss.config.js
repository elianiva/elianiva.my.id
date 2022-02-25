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
        "p > a": {
          position: "relative",
          display: "inline-block",
          "z-index": 5,
        },
        "p > a::after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          transform: "scale3d(0, 0, 0)",
          height: "2px",
          "z-index": "-1",
          "background-color": "var(--c-prose-accent)",
          transition: "transform ease-out 200ms",
        },
        "p > a:hover::after": {
          transform: "scale3d(1, 1, 1)",
        },
        strong: {
          color: "var(--un-prose-headings)",
        },
        p: {
          "font-family": "var(--font-sans)",
          "line-height": "1.625",
        },
        h1: {
          "font-size": "1.875rem",
        },
        h2: {
          "font-size": "1.5rem",
        },
        h3: {
          "font-size": "1.25rem",
        },
        "h1, h2, h3, h4, h5, h6": {
          "font-family": "var(--font-heading)",
          position: "relative",
        },
        "h1 a, h2 a, h3 a, h4 a, h5 a": {
          "font-weight": 600,
        },
        "h1::after": {
          content: '""',
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "0.125rem",
          "background-image": `linear-gradient(
            to right,
            var(--c-prose-accent),
            rgba(0, 0, 0, 0)
          )`,
        },
        "p > code": {
          color: "var(--un-prose-links)",
        },
        "pre, code": {
          "font-family": "var(--font-monospace)",
          "background-color": "var(--c-prose-alt-bg)",
          "font-weight": "normal",
          border: "none",
        },
        pre: {
          padding: "1rem",
          "margin-top": "1.25rem",
          "overflow-x": "auto",
          "scrollbar-color": "var(--un-font-)",
          "border-radius": "0.375rem",
          color: "var(--un-prose-body)",
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
      /^prose-custom$/,
      (_, { theme }) => ({
        "--font-heading": '"Poppins", sans-serif',
        "--font-sans": '"Open Sans", sans-serif',
        "--font-monospace": '"JetBrains Mono", monospace',
        "--un-prose-body": theme.colors.slate[600],
        "--un-prose-invert-body": theme.colors.slate[400],
        "--un-prose-links": theme.colors.slate[700],
        "--un-prose-invert-links": theme.colors.slate[300],
        "--un-prose-headings": theme.colors.slate[700],
        "--un-prose-invert-headings": theme.colors.slate[300],
        "--c-prose-accent": theme.colors.blue[600],
        "--c-prose-alt-bg": colors.white,
        "--c-prose-scrollbar-bg": theme.colors.gray[200],
        "--c-prose-thumb-bg": theme.colors.gray[300],
      }),
      { layer: "typography" },
    ],
    [
      /^prose-custom-invert$/,
      (_, { theme }) => ({
        "--c-prose-accent": theme.colors.red[500],
        "--c-prose-alt-bg": theme.colors.gray[800],
        "--c-prose-scrollbar-bg": theme.colors.gray[700],
        "--c-prose-thumb-bg": theme.colors.gray[600],
      }),
      { layer: "typography" },
    ],
    [
      /^custom-scrollbar$/,
      (_, { theme }) =>
        `
      html {
        scrollbar-color: ${theme.colors.gray[200]} ${theme.colors.blue[600]};
      }
      
      html::-webkit-scrollbar-thumb {
        background-color: ${theme.colors.blue[600]};
      }
      
      html::-webkit-scrollbar {
        background-color: ${theme.colors.gray[200]};
        width: 0.5rem;
      }

      html.dark {
        scrollbar-color: ${theme.colors.gray[800]} ${theme.colors.red[500]};
      }
      
      html.dark::-webkit-scrollbar-thumb {
        background-color:  ${theme.colors.red[500]};
      }
      
      html.dark::-webkit-scrollbar {
        background-color: ${theme.colors.gray[800]};
      }`.replace(/(\s)/g, ""),
      { layer: "default" },
    ],
  ],
  shortcuts: [
    [
      /^btn-lg-(.*)$/,
      ([, c]) => {
        return `bg-${c} inline-block mt-8 px-5 py-2 text-white rounded-md shadow-md no-underline font-heading text-lg tracking-wide transition-property-transform ease-out duration-200 hover:-translate-y-1 transform-gpu`;
      },
    ],
    [
      /^btn-(source|demo)$/,
      ([, kind]) => {
        const colour =
          kind === "demo"
            ? "bg-blue-600 dark:bg-red-500 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-slate-600 dark:text-slate-300";
        return `${colour} font-sans no-underline flex items-center gap-2 py-1 px-3 rounded-md transition-property-filter ease-out duration-200 hover:brightness-90`;
      },
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
