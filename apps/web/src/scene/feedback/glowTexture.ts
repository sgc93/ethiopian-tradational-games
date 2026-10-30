import * as THREE from 'three';

let cached: THREE.CanvasTexture | null = null;

/** A soft radial white glow, for sprites that are tinted by their material. Built once. */
export function glowTexture(): THREE.CanvasTexture {
  if (cached) return cached;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.35, 'rgba(255, 255, 255, 0.5)');
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  cached = new THREE.CanvasTexture(canvas);
  cached.colorSpace = THREE.SRGBColorSpace;
  return cached;
}
