import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// The install icons (192, 512, maskable, Apple touch, favicon) are all drawn from icon.svg.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: minimal2023Preset,
  images: ['public/icon.svg'],
});
