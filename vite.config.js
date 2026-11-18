// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base path ensures assets load properly on any GitHub Pages repo path
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
