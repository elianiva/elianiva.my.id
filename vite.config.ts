import { defineConfig } from "vite";
import solid from "solid-start";
import { resolve } from "path";
import unocss from "unocss/vite";
import presetWind from "@unocss/preset-wind";

export default defineConfig({
  plugins: [
    solid(),
    unocss({
      presets: [presetWind()]
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  }
});
