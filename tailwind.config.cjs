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
        clamped: "clamp(12rem, calc(20vw + 4rem), 16rem)"
      },
      height: {
        clamped: "clamp(12rem, calc(20vw + 4rem), 16rem)"
      },
    },
    fontFamily: {
      heading: ["Poppins", "sans-serif"],
      sans: ["Open Sans", "sans-serif"],
      monospace: ["JetBrains Mono", "monospace"],
    },
  },
  plugins: [],
  darkMode: "class",
};
