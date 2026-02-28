import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  output: "static",
  adapter: cloudflare({}),
  integrations: [react()],

  vite: {
    plugins: [
      tailwindcss(),
      visualizer({
        emitFile: true,
        filename: "stats.html",
      }),
    ],
    server: {
      allowedHosts: [".ngrok-free.app"],
    },
  },
});
