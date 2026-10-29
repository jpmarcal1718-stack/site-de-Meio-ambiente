import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173/site-de-Meio-ambiente/",
    trace: "retain-on-failure",
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173/site-de-Meio-ambiente/",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "notebook", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "celular", use: { viewport: { width: 390, height: 844 } } },
  ],
});
