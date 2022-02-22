import { defineConfig } from "vite";
import solid from "solid-start";
import { resolve } from "path";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  }
});
