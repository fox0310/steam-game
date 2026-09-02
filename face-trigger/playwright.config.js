import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "playtest.spec.js",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:5201",
    serviceWorkers: "allow",
  },
  webServer: {
    command: "PORT=5201 node server.cjs",
    url: "http://127.0.0.1:5201",
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
