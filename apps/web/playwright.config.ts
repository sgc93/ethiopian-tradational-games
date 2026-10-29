import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    // The installed Chrome, so the tests need no browser download.
    channel: 'chrome',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    // Held sideways: the game is landscape only, and portrait shows "turn your phone" (spec §9).
    { name: 'phone', use: { ...devices['Pixel 7 landscape'], channel: 'chrome' } },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview',
    port: 4173,
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
