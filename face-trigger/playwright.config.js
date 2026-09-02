import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "playtest.spec.js",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:5201",
    serviceWorkers: "allow",
  },
  projects: [
    { name: "Android Chrome", use: { ...devices["Pixel 5"], browserName: "chromium" } },
    { name: "iPhone Safari", use: { ...devices["iPhone 13"], browserName: "webkit" } },
    { name: "iPad Safari", use: { ...devices["iPad Pro 11"], browserName: "webkit" } },
  ],
  webServer: {
    command: "PORT=5201 node server.cjs",
    url: "http://127.0.0.1:5201",
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
