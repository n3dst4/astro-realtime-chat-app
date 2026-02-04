import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  adapter: cloudflare({}),
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});
