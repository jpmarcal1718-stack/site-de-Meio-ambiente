import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
const base = "/site-de-Meio-ambiente/";
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Gestão Ambiental · Ivaiporã",
        short_name: "Gestão Ambiental",
        lang: "pt-BR",
        description:
          "Demonstração acadêmica de organização de demandas ambientais.",
        theme_color: "#163e32",
        background_color: "#f5f7f3",
        display: "standalone",
        start_url: base,
        scope: base,
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
        navigateFallback: base + "index.html",
        navigateFallbackAllowlist: [/^\/site-de-Meio-ambiente\//],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
  build: { chunkSizeWarningLimit: 700 },
});
