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
      boxShadow: (t) => ({
        "sun-rays": `
              0 -1rem 0 ${t("colors.slate.600")},            /* north */
              0.75rem -0.75rem 0 ${t("colors.slate.600")},   /* north east */
              1rem 0 0 ${t("colors.slate.600")},             /* east */
              0.75rem 0.75rem 0 ${t("colors.slate.600")},    /* south east */
              0 1rem 0 ${t("colors.slate.600")},             /* south */
              -0.75rem 0.75rem 0 ${t("colors.slate.600")},   /* south west */
              -1rem 0 0 ${t("colors.slate.600")},            /* west */
              -0.75rem -0.75rem 0 ${t("colors.slate.600")};  /* north west */
        `,
      }),
      backgroundImage: (t) => ({
        "fading-line": `linear-gradient(to right, ${t("colors.red.500")}, rgba(0, 0, 0, 0))`
      })
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
