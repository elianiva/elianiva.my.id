module.exports = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
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
              0 -1rem 0 currentColor,            /* north */
              0.75rem -0.75rem 0 currentColor,   /* north east */
              1rem 0 0 currentColor,             /* east */
              0.75rem 0.75rem 0 currentColor,    /* south east */
              0 1rem 0 currentColor,             /* south */
              -0.75rem 0.75rem 0 currentColor,   /* south west */
              -1rem 0 0 currentColor,            /* west */
              -0.75rem -0.75rem 0 currentColor;  /* north west */
        `,
      },
      backgroundImage: (t) => ({
        "red-fading-line": `linear-gradient(to right, ${t(
          "colors.red.500"
        )}, rgba(0, 0, 0, 0))`,
        "blue-fading-line": `linear-gradient(to right, ${t(
          "colors.blue.600"
        )}, rgba(0, 0, 0, 0))`,
      }),
      typography: (t) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": t("colors.slate.600"),
            "--tw-prose-invert-body": t("colors.slate.400"),
            "--tw-prose-links": t("colors.slate.800"),
            "--tw-prose-invert-links": t("colors.slate.200"),
            "--tw-prose-bold": t("colors.slate.700"),
            "--tw-prose-invert-bold": t("colors.slate.300"),
            "--tw-prose-headings": t("colors.slate.700"),
            "--tw-prose-invert-headings": t("colors.slate.300"),
            h1: {
              color: "red",
              "&::after": {
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "0.125rem",
                ...t("bg-blue-fading-line"),
              },
            },
          },
        },
        invert: {
          css: {
            h1: {
              "&::after": {
                ...t("bg-red-fading-line"),
              },
            },
          },
        },
      }),
    },
    fontFamily: {
      heading: ["Poppins", "sans-serif"],
      sans: ["Open Sans", "sans-serif"],
      monospace: ["JetBrains Mono", "monospace"],
    },
  },
  plugins: [require("@tailwindcss/typography")],
  darkMode: "class",
};
