/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // Offline after the first visit and installable to the home screen (spec §6). The service
    // worker only adds caching; nothing in the game depends on it, so a Capacitor build still works.
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true },
      manifest: {
        name: 'Gebeta — ገበጣ',
        short_name: 'Gebeta',
        description: 'Gebeta (ገበጣ), the Ethiopian game of stones and holes, in 3D.',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#4a2a1c',
        background_color: '#2e1a12',
      },
      workbox: {
        // No webmanifest here: the plugin precaches the manifest itself, and listing it twice
        // (with different revisions) makes Workbox throw while the service worker starts.
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,webp,json}'],
        // One self-contained sw.js, so a worker that fails to start fails registration loudly,
        // instead of running without caching anything.
        inlineWorkboxRuntime: true,
      },
    }),
  ],
  worker: { format: 'es' },
  // Bundle these once at startup. Discovering them mid-session makes Vite re-bundle and can
  // leave two copies of React in the page (the 3D renderer on one, the app on the other).
  optimizeDeps: {
    include: [
      'react',
      'react-dom/client',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'gsap',
      'zustand',
      'i18next',
      'react-i18next',
    ],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
