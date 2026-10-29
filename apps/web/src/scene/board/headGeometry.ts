import * as THREE from 'three';
import type { Blueprint, Point2 } from './blueprint';

/** Plain typed arrays, so a worker can build the geometry and transfer it. */
export interface GeometryData {
  position: Float32Array;
  normal: Float32Array;
  uv: Float32Array;
  index: Uint32Array;
}

export function toBufferGeometry(d: GeometryData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(d.position, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(d.normal, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(d.uv, 2));
  g.setIndex(new THREE.BufferAttribute(d.index, 1));
  return g;
}

/** Packs a geometry (which must have position and uv) into transferable arrays, computing the normals. */
export function fromBufferGeometry(g: THREE.BufferGeometry): GeometryData {
  const indexed = g.index ? g : g.toNonIndexed();
  if (!indexed.index) {
    const n = indexed.getAttribute('position').count;
    indexed.setIndex(Array.from({ length: n }, (_, i) => i));
  }
  indexed.computeVertexNormals();
  return {
    position: new Float32Array(indexed.getAttribute('position').array),
    normal: new Float32Array(indexed.getAttribute('normal').array),
    uv: new Float32Array(indexed.getAttribute('uv').array),
    index: new Uint32Array(indexed.index!.array),
  };
}

/** Where a closed polygon's edges cross the line `b = value` (polygon points are (a, b)): the `a` values. */
function crossings(poly: Point2[], value: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < poly.length; i++) {
    const [a0, b0] = poly[i]!;
    const [a1, b1] = poly[(i + 1) % poly.length]!;
    if ((b0 <= value && b1 > value) || (b1 <= value && b0 > value)) out.push(a0 + ((value - b0) / (b1 - b0)) * (a1 - a0));
  }
  return out;
}

/** The extent [min, max] of a polygon along `a` at `b = value`, or null when the line misses it. */
function extentAt(poly: Point2[], value: number): [number, number] | null {
  const xs = crossings(poly, value);
  return xs.length < 2 ? null : [Math.min(...xs), Math.max(...xs)];
}

/** Distance from `origin` along the ray at angle `theta` to the nearest edge of a polygon, or Infinity. */
function rayToPolygon(poly: Point2[], origin: Point2, theta: number): number {
  const dx = Math.cos(theta);
  const dy = Math.sin(theta);
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i]!;
    const [x1, y1] = poly[(i + 1) % poly.length]!;
    const ex = x1 - x0;
    const ey = y1 - y0;
    const det = dx * ey - dy * ex;
    if (Math.abs(det) < 1e-9) continue;
    const ox = x0 - origin[0];
    const oy = y0 - origin[1];
    const t = (ox * ey - oy * ex) / det;
    const s = (ox * dy - oy * dx) / det;
    if (t > 0 && s >= 0 && s <= 1 && t < best) best = t;
  }
  return best;
}

/**
 * The head without its horns, carved from the blueprint's three head-only outlines. The side
 * view is the master: for each height v, the side outline gives the head's length, the face
 * outline its width, and the top outline trims the plan. Head-local axes: u forward, v up,
 * w sideways; the neck foot sits on v = 0.
 */
export function buildHead(bp: Blueprint, budget = 8000): GeometryData {
  const { sideHeadOnly: side, frontHeadOnly: front, topHeadOnly: top } = bp.heads.outlines;
  const { earTipV } = bp.heads.measures;
  const fillet = bp.heads.neckFilletRadius;

  const around = budget >= 6000 ? 48 : 32;
  const slices = Math.min(60, Math.floor((budget - 2 * around) / (2 * around)));

  // Ring centres and radii per slice.
  const rings: { uc: number; v: number; r: number[] }[] = [];
  let last: [number, number] = [0, 0.5];
  let lastW = 0.4;
  for (let i = 0; i <= slices; i++) {
    const v = (earTipV * i) / slices;
    const probe = Math.min(v, earTipV - 1e-4);
    const uRange = extentAt(side, probe) ?? last;
    last = uRange;
    const wRange = extentAt(front, probe);
    const wHalf = wRange ? Math.max(1e-3, (wRange[1] - wRange[0]) / 2) : lastW;
    lastW = wHalf;
    const uc = (uRange[0] + uRange[1]) / 2;
    const a = Math.max(1e-3, (uRange[1] - uRange[0]) / 2);
    const taper = i === slices ? 0.02 : 1;
    const r: number[] = [];
    for (let j = 0; j < around; j++) {
      const theta = (2 * Math.PI * j) / around;
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      const ellipse = 1 / Math.sqrt((c * c) / (a * a) + (s * s) / (wHalf * wHalf));
      const plan = rayToPolygon(top, [uc, 0], theta);
      let radius = Math.min(ellipse, plan) * taper;
      if (v < fillet) radius += fillet - Math.sqrt(Math.max(0, fillet * fillet - (fillet - v) ** 2));
      r.push(radius);
    }
    rings.push({ uc, v, r });
  }

  // Two passes of smoothing over the rings, leaving the neck foot where it is.
  for (let pass = 0; pass < 2; pass++) {
    const copy = rings.map((ring) => ring.r.slice());
    for (let i = 1; i < rings.length - 1; i++) {
      for (let j = 0; j < around; j++) {
        const nb =
          (copy[i - 1]![j]! + copy[i + 1]![j]! + copy[i]![(j + 1) % around]! + copy[i]![(j - 1 + around) % around]!) / 4;
        rings[i]!.r[j] = copy[i]![j]! * 0.5 + nb * 0.5;
      }
    }
  }

  const position: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  rings.forEach((ring, i) => {
    for (let j = 0; j < around; j++) {
      const theta = (2 * Math.PI * j) / around;
      position.push(ring.uc + ring.r[j]! * Math.cos(theta), ring.v, ring.r[j]! * Math.sin(theta));
      uv.push(j / around, i / slices);
    }
  });
  for (let i = 0; i < slices; i++) {
    for (let j = 0; j < around; j++) {
      const a = i * around + j;
      const b = i * around + ((j + 1) % around);
      const c = a + around;
      const d = b + around;
      index.push(a, b, c, b, d, c);
    }
  }
  // Caps: the neck foot (facing down) and the ear tip (facing up).
  const foot = position.length / 3;
  position.push(rings[0]!.uc, 0, 0);
  uv.push(0.5, 0);
  for (let j = 0; j < around; j++) index.push(foot, (j + 1) % around, j);
  const tip = position.length / 3;
  const lastRing = rings[rings.length - 1]!;
  position.push(lastRing.uc, lastRing.v, 0);
  uv.push(0.5, 1);
  const base = slices * around;
  for (let j = 0; j < around; j++) index.push(tip, base + j, base + ((j + 1) % around));

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  return fromBufferGeometry(g);
}

/**
 * Moves a head-local geometry (u forward, v up, w sideways) to one end of the board. End B's head
 * stands at x = −heads.x and faces +x; end A's stands at +heads.x and faces −x.
 */
export function placeHead<T extends THREE.BufferGeometry>(g: T, end: 'A' | 'B', bp?: Blueprint): T {
  const x = bp?.heads.x ?? 5.25;
  if (end === 'A') g.rotateY(Math.PI).translate(x, 0, 0);
  else g.translate(-x, 0, 0);
  return g;
}
