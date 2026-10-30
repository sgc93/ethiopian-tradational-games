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
  // The three landscape sizes of spec §12: a full-height phone, a phone browser with its toolbars
  // (the compact layout below 340 px), and a desktop window. Portrait is its own test.
  projects: [
    { name: 'phone-full', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 844, height: 390 }, hasTouch: true } },
    { name: 'phone-compact', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 750, height: 300 }, hasTouch: true } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1280, height: 720 } } },
    // Spec §12 names 1920 × 1080 as an acceptance size: the interface at its ×1.6 cap over a wide frame.
    { name: 'desktop-large', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1920, height: 1080 } } },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview',
    port: 4173,
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
