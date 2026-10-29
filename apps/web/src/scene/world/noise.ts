import * as THREE from 'three';
import { hash2 } from '../layout';

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Smooth value noise in [-1, 1]; with a `period` the lattice wraps, so the result tiles. */
export function valueNoise(x: number, z: number, seed: number, period = 0): number {
  const wrap = (i: number) => (period > 0 ? ((i % period) + period) % period : i);
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = smooth(x - x0);
  const fz = smooth(z - z0);
  const at = (i: number, k: number) => hash2(wrap(i) + seed * 7919, wrap(k)) * 2 - 1;
  const top = at(x0, z0) * (1 - fx) + at(x0 + 1, z0) * fx;
  const bottom = at(x0, z0 + 1) * (1 - fx) + at(x0 + 1, z0 + 1) * fx;
  return top * (1 - fz) + bottom * fz;
}

const PERIOD = 8;

/** The three noise channels at pixel (x, y) of a `size` texture: mixed, coarse and fine, each in [0, 1]. */
export function noiseSample(x: number, y: number, size: number, seed: number): [number, number, number] {
  const u = (x / size) * PERIOD;
  const v = (y / size) * PERIOD;
  const coarse = 0.5 + 0.5 * valueNoise(u, v, seed, PERIOD);
  const fine = 0.5 + 0.5 * valueNoise(u * 4, v * 4, seed + 1, PERIOD * 4);
  return [0.65 * coarse + 0.35 * fine, coarse, fine];
}

/** RGBA bytes of a tileable two-octave noise, one octave per channel pair, for the flame and smoke shaders. */
export function makeNoiseData(size: number, seed: number): Uint8Array {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [mixed, coarse, fine] = noiseSample(x, y, size, seed);
      const i = (y * size + x) * 4;
      data[i] = Math.round(mixed * 255);
      data[i + 1] = Math.round(coarse * 255);
      data[i + 2] = Math.round(fine * 255);
      data[i + 3] = 255;
    }
  }
  return data;
}

/** The noise as a repeating texture. */
export function makeNoiseTexture(size = 256, seed = 1): THREE.DataTexture {
  const t = new THREE.DataTexture(makeNoiseData(size, seed), size, size);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}
