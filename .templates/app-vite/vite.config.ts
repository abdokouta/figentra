/**
 * Vite configuration for the Figentra React application.
 *
 * Tailwind CSS v4 is provided through the official Vite plugin; HeroUI v3
 * provides its component behavior and standalone theme styles.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Public exported symbol. */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [react(), tailwindcss()],
});
