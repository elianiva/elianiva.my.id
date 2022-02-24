import { presetUno, transformerVariantGroup } from "unocss";
import { defineConfig } from "unocss/vite";

export default defineConfig({
  presets: [presetUno()],
  transformers: [transformerVariantGroup()],
  rules: [
    [
      /^content-\[(.*)\]$/,
      ([, content]) => ({ content: JSON.stringify(content) }),
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
    backgroundImage: (t) => ({
      "red-fading-line": `linear-gradient(to right, ${t(
        "colors.red.500"
      )}, rgba(0, 0, 0, 0))`,
      "blue-fading-line": `linear-gradient(to right, ${t(
        "colors.blue.600"
      )}, rgba(0, 0, 0, 0))`,
    }),
  },
});
