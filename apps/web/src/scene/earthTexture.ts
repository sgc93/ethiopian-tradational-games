import * as THREE from 'three';
import { valueNoise } from './earthGeometry';
import { hash2 } from './layout';

const DARK = new THREE.Color('#5a3020');
const LIGHT = new THREE.Color('#8e5638');
const SAND = new THREE.Color('#b8875f');
const PERIOD = 6;

/** Red-brown trodden earth, drawn in code so nothing has to be downloaded. Browser only. */
export function makeEarthTexture(size: number, seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const c = new THREE.Color();
  const rgb = { r: 0, g: 0, b: 0 };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * PERIOD;
      const v = (y / size) * PERIOD;
      const broad =
        0.5 + 0.5 * (0.6 * valueNoise(u, v, seed, PERIOD) + 0.3 * valueNoise(u * 3, v * 3, seed + 1, PERIOD * 3));
      const grain = hash2(x + seed * 131, y) * 0.16 - 0.08;
      c.copy(DARK).lerp(LIGHT, Math.min(1, Math.max(0, broad + grain)));
      if (hash2(y * 7 + seed, x * 13) > 0.985) c.lerp(SAND, 0.6); // the odd grain of lighter sand
      // Canvas pixels are sRGB; three.js colours are linear, so convert on the way out.
      c.getRGB(rgb, THREE.SRGBColorSpace);
      const i = (y * size + x) * 4;
      img.data[i] = rgb.r * 255;
      img.data[i + 1] = rgb.g * 255;
      img.data[i + 2] = rgb.b * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
