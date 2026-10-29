// Traces the black-and-white masks written by make-masks.ps1 into vector outlines.
// Usage: node trace-outline.mjs <masks-dir> <out.json>
// Output: { name: { w, h, contours: [[[x, y], ...], ...] } } in mask pixels (y down), largest outline first.
// make-blueprint.mjs also imports traceMask to trace the horn rasters it builds.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Corner points measured on the source image, stored as fractions so they hold at any mask size.
const fractions = (w, h, pts) => pts.map(([x, y]) => [x / w, y / h]);

// Each job traces one mask, optionally keeping only the part inside a polygon.
// The "-head" jobs cut the horns off, because the blueprint rebuilds the horns from a centre line.
// front-head is also cut flat at the neck foot: the silhouette's rounded bottom is not a real base.
const JOBS = {
  side: { mask: 'side.mask' },
  'side-head': {
    mask: 'side.mask',
    keep: fractions(1024, 1024, [
      [255, 1024], [300, 780], [400, 560], [500, 420], [505, 300], [560, 305], [625, 395], [1024, 395], [1024, 1024],
    ]),
  },
  'front-head': {
    mask: 'front.mask',
    keep: fractions(1280, 853, [
      [400, 280], [500, 318], [533, 356], [620, 321], [642, 321], [729, 356], [762, 318], [862, 280], [862, 738], [400, 738],
    ]),
  },
  'top-head': { mask: 'top.mask', keep: fractions(1024, 1024, [[0, 490], [1024, 490], [1024, 1024], [0, 1024]]) },
};

function readMask(path) {
  const [head, ...rows] = readFileSync(path, 'utf8').trim().split('\n');
  const [w, h] = head.split(' ').map(Number);
  return { w, h, at: (x, y) => rows[y].charCodeAt(x) === 49 };
}

function inside([x, y], poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

// Marching squares: one or two edge segments per 2x2 cell, joined at edge midpoints.
// Points are kept doubled (integers) while joining, so equal midpoints compare exactly.
// Out-of-range pixels count as empty, so every outline closes.
function trace({ w, h, at }) {
  const get = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : at(x, y) ? 1 : 0);
  const T = (x, y) => [2 * x + 1, 2 * y];
  const R = (x, y) => [2 * x + 2, 2 * y + 1];
  const B = (x, y) => [2 * x + 1, 2 * y + 2];
  const L = (x, y) => [2 * x, 2 * y + 1];
  const CASES = {
    1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[T, R]], 5: [[T, R], [L, B]], 6: [[T, B]], 7: [[L, T]],
    8: [[L, T]], 9: [[T, B]], 10: [[L, T], [B, R]], 11: [[T, R]], 12: [[L, R]], 13: [[B, R]], 14: [[L, B]],
  };
  const links = new Map();
  const key = (p) => p[0] * 100000 + p[1];
  const link = (a, b) => {
    for (const [p, q] of [[a, b], [b, a]]) {
      const k = key(p);
      if (!links.has(k)) links.set(k, { p, next: [] });
      links.get(k).next.push(key(q));
    }
  };
  for (let y = -1; y < h; y++) {
    for (let x = -1; x < w; x++) {
      const c = (get(x, y) << 3) | (get(x + 1, y) << 2) | (get(x + 1, y + 1) << 1) | get(x, y + 1);
      for (const [e1, e2] of CASES[c] ?? []) link(e1(x, y), e2(x, y));
    }
  }
  const used = new Set();
  const loops = [];
  for (const [start] of links) {
    if (used.has(start)) continue;
    const loop = [];
    let prev = -1;
    let cur = start;
    while (cur !== undefined && !used.has(cur)) {
      used.add(cur);
      const node = links.get(cur);
      loop.push([node.p[0] / 2, node.p[1] / 2]);
      const nxt = node.next.find((k) => k !== prev && !used.has(k));
      prev = cur;
      cur = nxt;
    }
    if (loop.length > 8) loops.push(loop);
  }
  return loops;
}

export const area = (pts) => pts.reduce((s, [x, y], i) => {
  const [x2, y2] = pts[(i + 1) % pts.length];
  return s + x * y2 - x2 * y;
}, 0) / 2;

// Ramer–Douglas–Peucker, run on the closed loop split at its two farthest-apart points.
function simplify(pts, tol) {
  const rdp = (a) => {
    if (a.length < 3) return a;
    const [x1, y1] = a[0];
    const [x2, y2] = a[a.length - 1];
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    let best = -1;
    let idx = 0;
    for (let i = 1; i < a.length - 1; i++) {
      const d = Math.abs((y2 - y1) * a[i][0] - (x2 - x1) * a[i][1] + x2 * y1 - y2 * x1) / len;
      if (d > best) [best, idx] = [d, i];
    }
    if (best <= tol) return [a[0], a[a.length - 1]];
    return [...rdp(a.slice(0, idx + 1)).slice(0, -1), ...rdp(a.slice(idx))];
  };
  let far = 0;
  let farD = -1;
  for (let i = 0; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > farD) [farD, far] = [d, i];
  }
  const a = rdp(pts.slice(0, far + 1));
  const b = rdp([...pts.slice(far), pts[0]]);
  return [...a.slice(0, -1), ...b.slice(0, -1)].map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
}

// Outlines of a mask { w, h, at(x, y) }, largest first, specks dropped.
export function traceMask(mask, { minArea = 60, tol = 0.9 } = {}) {
  return trace(mask)
    .filter((l) => Math.abs(area(l)) > minArea)
    .sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)))
    .map((l) => simplify(l, tol));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [dir, out] = process.argv.slice(2);
  const result = {};
  for (const [name, job] of Object.entries(JOBS)) {
    const mask = readMask(join(dir, job.mask));
    const at = job.keep
      ? (x, y) => mask.at(x, y) && inside([(x + 0.5) / mask.w, (y + 0.5) / mask.h], job.keep)
      : mask.at;
    const loops = traceMask({ ...mask, at });
    result[name] = { w: mask.w, h: mask.h, contours: loops };
    console.log(`${name}: ${loops.length} outlines, ${loops.reduce((s, l) => s + l.length, 0)} points`);
  }
  writeFileSync(out, JSON.stringify(result));
}
