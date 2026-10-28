/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
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
