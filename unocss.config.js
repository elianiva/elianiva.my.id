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
    fontSize: {
      "clamped-lg": "clamp(1.25rem, calc(5vw + 1.25rem), 3rem)",
      "clamped-md": "clamp(1rem, calc(5vw + 0.5rem), 1.625rem)",
      "clamped-sm": "clamp(0.8rem, calc(2vw + 0.5rem), 1.125rem)",
    },
    boxShadow: {
      "sun-rays": `
        0 -1rem 0 currentColor,            /* north */
        0.75rem -0.75rem 0 currentColor,   /* north east */
        1rem 0 0 currentColor,             /* east */
        0.75rem 0.75rem 0 currentColor,    /* south east */
        0 1rem 0 currentColor,             /* south */
        -0.75rem 0.75rem 0 currentColor,   /* south west */
        -1rem 0 0 currentColor,            /* west */
        -0.75rem -0.75rem 0 currentColor;  /* north west */`,
    },
  },
});
