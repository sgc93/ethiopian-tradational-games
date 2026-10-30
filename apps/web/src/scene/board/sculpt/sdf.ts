import type { Blueprint, Point2 } from '../blueprint';

/**
 * The Walia ibex head (without its horns) as a field that is negative inside, in head-local units:
 * u forward to the muzzle, v up from the board's top, w sideways. The head is the blueprint's
 * traced side outline inflated sideways, as a carver roughs a profile out of a block: its width
 * at each point comes from the traced front and top outlines and its edges round over. The ears
 * are leaves of their own, and the eyes, lids, brow, cheeks, mouth, nostrils and beard are cut
 * into the inflated surface where the carved references (docs/design/board/images 07, 08, 11)
 * put them. `mesh.ts` meshes the field offline; the horns are swept tubes (`horn.ts`).
 */

export type V3 = [number, number, number];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Landmarks read off the side reference (image 07) at the blueprint's scale (220 px a unit). */
export const PROFILE = {
  /** The eye's centre on the side of the head; the almond's front corner sits a little lower. */
  eye: { u: 1.0, v: 1.66, halfLength: 0.13, halfHeight: 0.045, tilt: -0.14 },
  /** A nostril's centre on the front-side of the nose, either side. */
  nostril: { u: 1.548, v: 1.055, w: 0.078 },
  /** The mouth line, from the lips' front back to the corner, which rises a little. */
  mouth: [
    [1.53, 0.848],
    [1.43, 0.878],
    [1.33, 0.925],
    [1.235, 0.975],
  ] as Point2[],
  /** The beard hangs below this height, in front of this line. */
  beard: { belowV: 0.8, frontOfU: 1.0, halfWidth: 0.14 },
  /** An ear (side +1): its root at the poll, behind the horn, and its tip up, back and out. */
  ear: { base: [0.4, 1.95, 0.4] as V3, tip: [0.17, 2.33, 0.7] as V3, halfWidth: 0.17 },
  /** The neck's foot sinks this far into the board's top so the two meet without a seam. */
  footSink: 0.04,
};

/**
 * Half the head's width seen from the front, by height, with the ears left out: measured on the
 * front reference (image 08, 273 px a unit). The carving's neck is stouter than the blueprint's
 * traced front outline, nearly as wide as it is deep, and flares to its foot.
 */
const FRONT: Point2[] = [
  [-1, 0.585],
  [0, 0.585],
  [0.13, 0.59],
  [0.25, 0.575],
  [0.38, 0.55],
  [0.5, 0.52],
  [0.6, 0.495],
  [0.725, 0.47],
  [0.85, 0.46],
  [1.0, 0.45],
  [1.15, 0.44],
  [1.33, 0.43],
  [1.45, 0.425],
  [1.66, 0.43],
  [1.82, 0.4],
  [1.99, 0.35],
  [2.1, 0.31],
  [2.6, 0.25],
];

/** Half the face's width by reach, from the eyes forward to the nose pad (image 08); unlimited behind the eyes. */
const TOP: Point2[] = [
  [-2, 1],
  [0.85, 1],
  [0.9, 0.47],
  [1.0, 0.44],
  [1.1, 0.36],
  [1.2, 0.28],
  [1.3, 0.22],
  [1.42, 0.19],
  [1.52, 0.165],
  [1.6, 0.14],
  [2, 0.14],
];

/**
 * How far the edges round over, as a multiple of the local half-width: the neck and the back of
 * the head round fully, the face's planes are flatter and turn more crisply at the profile.
 */
function rounding(u: number, v: number): number {
  return 1.4 - 0.65 * smoothstep(0.8, 1.0, u) * smoothstep(0.85, 1.1, v);
}


/** Polynomial smooth minimum: a union with a fillet of about `k`. */
function smin(a: number, b: number, k: number): number {
  const h = clamp01(0.5 + (0.5 * (b - a)) / k);
  return b + (a - b) * h - k * h * (1 - h);
}
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

function table(t: Point2[], x: number): number {
  if (x <= t[0]![0]) return t[0]![1];
  for (let i = 1; i < t.length; i++) {
    const [x1, y1] = t[i]!;
    if (x <= x1) {
      const [x0, y0] = t[i - 1]!;
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return t.at(-1)![1];
}

/**
 * The side outline the head is inflated from: the traced head-only outline with the ear taken
 * out (it is modelled as a leaf) and the poll rounded where it was, and the foot's rounded corners
 * replaced by the neck's walls carried on below the board's top, so the foot is a clean cut.
 */
export function headProfile(bp: Blueprint): Point2[] {
  const src = bp.heads.outlines.sideHeadOnly;
  const isEar = ([u, v]: Point2) => v > 1.91 && u < 0.531;
  const isFoot = ([, v]: Point2) => v < 0.1;
  const kept = (p: Point2) => !isEar(p) && !isFoot(p);
  const start = src.findIndex(kept);
  const out: Point2[] = [];
  for (let k = 0; k < src.length; k++) {
    const p = src[(start + k) % src.length]!;
    if (kept(p)) {
      out.push(p);
      continue;
    }
    const prev = src[(start + k - 1 + src.length) % src.length]!;
    if (!kept(prev)) continue; // inside a run already replaced
    if (isEar(p)) out.push([0.33, 1.965], [0.43, 2.01], [0.53, 2.035]);
    else out.push([0.8, -0.4], [-0.8, -0.4]);
  }
  return out;
}

function signedDistance(poly: Point2[], u: number, v: number): number {
  let best = Infinity;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j]!;
    const [bx, by] = poly[i]!;
    const ex = bx - ax;
    const ey = by - ay;
    const t = clamp01(((u - ax) * ex + (v - ay) * ey) / (ex * ex + ey * ey || 1));
    const dx = u - ax - ex * t;
    const dy = v - ay - ey * t;
    best = Math.min(best, dx * dx + dy * dy);
    if (ay > v !== by > v && u < ax + ((v - ay) * ex) / ey) inside = !inside;
  }
  return inside ? Math.sqrt(best) : -Math.sqrt(best);
}

function distanceToPolyline(line: Point2[], u: number, v: number): { d: number; t: number } {
  let best = Infinity;
  let at = 0;
  let run = 0;
  let total = 0;
  for (let i = 1; i < line.length; i++) total += Math.hypot(line[i]![0] - line[i - 1]![0], line[i]![1] - line[i - 1]![1]);
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1]!;
    const [bx, by] = line[i]!;
    const ex = bx - ax;
    const ey = by - ay;
    const len = Math.hypot(ex, ey);
    const t = clamp01(((u - ax) * ex + (v - ay) * ey) / (len * len));
    const d = Math.hypot(u - ax - ex * t, v - ay - ey * t);
    if (d < best) {
      best = d;
      at = (run + t * len) / total;
    }
    run += len;
  }
  return { d: best, t: at };
}

/** The carved details, as outward offsets of the side surface at (u, v). */
function relief(u: number, v: number, inset: number): number {
  const g = (cu: number, cv: number, su: number, sv: number) => Math.exp(-(((u - cu) / su) ** 2) - ((v - cv) / sv) ** 2);
  // The eye, brow and cheeks sit on the side planes: faded out towards the profile so nothing shows as a bar from the front.
  const side = smoothstep(0.05, 0.14, inset);
  let d = 0;
  // The eye: an almond opening, the ball a little below the lids, the upper lid the heavier.
  const e = PROFILE.eye;
  const c = Math.cos(e.tilt);
  const s = Math.sin(e.tilt);
  const x = (u - e.u) * c + (v - e.v) * s;
  const y = -(u - e.u) * s + (v - e.v) * c;
  const r = 1 - (x / e.halfLength) ** 2;
  const half = e.halfHeight * Math.max(0, r);
  const edge = Math.abs(x) < e.halfLength ? Math.abs(y) - half : Math.hypot(Math.abs(x) - e.halfLength, y);
  const lid = (y > 0 ? 0.05 : 0.035) * smoothstep(-0.004, 0.005, edge) * Math.exp(-Math.max(0, edge) / 0.028);
  const ball = edge < 0 ? 0.01 + 0.014 * Math.sqrt(Math.max(0, 1 - (x / e.halfLength) ** 2 - (y / e.halfHeight) ** 2)) : 0;
  let eye = Math.max(lid, ball);
  eye -= 0.026 * Math.exp(-((x / 0.22) ** 2) - (y / 0.14) ** 2) * smoothstep(0.02, 0.05, edge); // the socket round the lids
  eye += 0.03 * g(0.97, 1.79, 0.17, 0.045); // the brow over it
  eye -= 0.012 * Math.exp(-((distanceToPolyline([[1.12, 1.635], [1.2, 1.53]], u, v).d / 0.012) ** 2)); // the tear line
  // The cheekbone under the eye and the jaw's muscle behind the mouth.
  eye += 0.03 * g(0.88, 1.5, 0.16, 0.07);
  eye += 0.035 * g(0.76, 1.18, 0.2, 0.17);
  d += eye * side;
  // The mouth: a cut line with the upper lip just proud of it.
  const m = distanceToPolyline(PROFILE.mouth, u, v);
  const fade = smoothstep(1, 0.85, m.t);
  d -= 0.024 * Math.exp(-((m.d / 0.011) ** 2)) * fade;
  d += 0.01 * g(1.42, 0.93, 0.12, 0.03);
  // The beard's long locks.
  const b = PROFILE.beard;
  if (v < b.belowV + 0.05 && u > b.frontOfU) d -= 0.012 * Math.max(0, Math.cos((2 * Math.PI * (u - 1.15)) / 0.065)) ** 2 * smoothstep(b.belowV + 0.05, b.belowV - 0.05, v);
  return d;
}

interface HeightMap {
  u0: number;
  v0: number;
  cell: number;
  nu: number;
  nv: number;
  h: Float32Array;
  hu: Float32Array;
  hv: Float32Array;
}

const maps = new WeakMap<Blueprint, HeightMap>();

/** The half-width of the inflated head on a fine grid over (u, v), with its slopes. */
function heightMap(bp: Blueprint): HeightMap {
  const cached = maps.get(bp);
  if (cached) return cached;
  const poly = headProfile(bp);
  const cell = 0.006;
  const u0 = -0.95;
  const v0 = -0.45;
  const nu = Math.ceil((1.75 - u0) / cell) + 1;
  const nv = Math.ceil((2.45 - v0) / cell) + 1;
  const raw = new Float32Array(nu * nv);
  const exact = new Float32Array(nu * nv);
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) exact[j * nu + i] = signedDistance(poly, u0 + i * cell, v0 + j * cell);
  // Smoothed, the distance keeps its zero at the outline but loses the ridge along the shape's
  // middle (where the nearest edge changes sides), which would show as a crease down the neck.
  const inset = blur(exact, nu, nv, 0.05 / cell);
  const b = PROFILE.beard;
  for (let j = 0; j < nv; j++) {
    const v = v0 + j * cell;
    const front = table(FRONT, v);
    for (let i = 0; i < nu; i++) {
      const u = u0 + i * cell;
      const d = inset[j * nu + i]!;
      if (d <= 0) {
        raw[j * nu + i] = d;
        continue;
      }
      const beard = smoothstep(b.belowV + 0.06, b.belowV - 0.04, v) * smoothstep(b.frontOfU - 0.05, b.frontOfU + 0.03, u);
      // The beard is broad where it hangs from the chin and draws to a point.
      const beardWidth = b.halfWidth * (0.35 + 0.65 * smoothstep(0.45, b.belowV, v));
      const w = Math.min(front, table(TOP, u)) * (1 - beard) + beardWidth * beard;
      const x = Math.min(1, d / (rounding(u, v) * w));
      raw[j * nu + i] = w * Math.sqrt(1 - (1 - x) ** 3);
    }
  }
  // Not blurred: the profile's square rise at the outline is what rounds the edges.
  const h = raw;
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const k = j * nu + i;
      if (h[k]! > 0) h[k] = h[k]! + relief(u0 + i * cell, v0 + j * cell, inset[k]!) * smoothstep(0, 0.04, h[k]!);
    }
  }
  const hu = new Float32Array(nu * nv);
  const hv = new Float32Array(nu * nv);
  for (let j = 1; j < nv - 1; j++) {
    for (let i = 1; i < nu - 1; i++) {
      const k = j * nu + i;
      hu[k] = (h[k + 1]! - h[k - 1]!) / (2 * cell);
      hv[k] = (h[k + nu]! - h[k - nu]!) / (2 * cell);
    }
  }
  const map = { u0, v0, cell, nu, nv, h, hu, hv };
  maps.set(bp, map);
  return map;
}

function blur(src: Float32Array, nu: number, nv: number, sigma: number): Float32Array {
  const r = Math.ceil(sigma * 2.5);
  const kernel: number[] = [];
  let sum = 0;
  for (let k = -r; k <= r; k++) {
    const w = Math.exp(-(k * k) / (2 * sigma * sigma));
    kernel.push(w);
    sum += w;
  }
  for (let k = 0; k < kernel.length; k++) kernel[k] = kernel[k]! / sum;
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += src[j * nu + Math.min(nu - 1, Math.max(0, i + k))]! * kernel[k + r]!;
      tmp[j * nu + i] = acc;
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += tmp[Math.min(nv - 1, Math.max(0, j + k)) * nu + i]! * kernel[k + r]!;
      out[j * nu + i] = acc;
    }
  }
  return out;
}

function sample(map: HeightMap, a: Float32Array, u: number, v: number): number {
  const x = (u - map.u0) / map.cell;
  const y = (v - map.v0) / map.cell;
  const i = Math.floor(x);
  const j = Math.floor(y);
  if (i < 0 || j < 0 || i >= map.nu - 1 || j >= map.nv - 1) return -1;
  const fx = x - i;
  const fy = y - j;
  const k = j * map.nu + i;
  return (a[k]! * (1 - fx) + a[k + 1]! * fx) * (1 - fy) + (a[k + map.nu]! * (1 - fx) + a[k + map.nu + 1]! * fx) * fy;
}

/** The half-width of the inflated head at (u, v), detail included; negative outside the profile. */
export function headHalfWidth(bp: Blueprint, u: number, v: number): number {
  return sample(heightMap(bp), heightMap(bp).h, u, v);
}

function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function normalize(a: V3): V3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** An ear: a pointed leaf from the poll, its cup turned forward and a little out, the edges curling forward. */
export function earSdf(p: V3, side: 1 | -1): number {
  const e = PROFILE.ear;
  const base: V3 = [e.base[0], e.base[1], e.base[2] * side];
  const tip: V3 = [e.tip[0], e.tip[1], e.tip[2] * side];
  const axis = normalize(sub(tip, base));
  const root: V3 = [base[0] - axis[0] * 0.12, base[1] - axis[1] * 0.12, base[2] - axis[2] * 0.12];
  const length = Math.hypot(...sub(tip, root));
  const facing: V3 = [0.6, 0.05, 0.8 * side];
  const n = normalize(sub(facing, [axis[0] * dot(facing, axis), axis[1] * dot(facing, axis), axis[2] * dot(facing, axis)]));
  const b = cross(axis, n);
  const q = sub(p, root);
  const s = dot(q, axis);
  const y = dot(q, b);
  const z = dot(q, n);
  const x = clamp01(s / length);
  const half = e.halfWidth * Math.pow(1 - x, 0.7) * Math.sqrt(Math.min(1, (x + 0.08) / 0.4));
  const curl = 0.045 * Math.min(1, Math.abs(y) / Math.max(half, 1e-3)) ** 2;
  const thick = 0.012 + 0.03 * (1 - 0.5 * x);
  const across = Math.max(Math.abs(y) - half, -s, s - length);
  const through = Math.abs(z - curl) - thick;
  return Math.hypot(Math.max(across, 0), Math.max(through, 0)) + Math.min(Math.max(across, through), 0);
}

function sdEllipsoid(p: V3, c: V3, r: V3): number {
  const x = (p[0] - c[0]) / r[0];
  const y = (p[1] - c[1]) / r[1];
  const z = (p[2] - c[2]) / r[2];
  const k0 = Math.hypot(x, y, z);
  const k1 = Math.hypot(x / r[0], y / r[1], z / r[2]);
  return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
}

/** How softly the two sides of the inflated head meet along the profile. */
const SEAM = 0.012;

/** The head without its horns: negative inside. */
export function headSdf(bp: Blueprint, p: V3): number {
  const map = heightMap(bp);
  const [u, v, w] = p;
  const h = sample(map, map.h, u, v);
  const gu = Math.min(12, Math.abs(sample(map, map.hu, u, v)));
  const gv = Math.min(12, Math.abs(sample(map, map.hv, u, v)));
  // The half-width rises square from the outline, so the two sides meet round; a touch of
  // softening takes out what is left of the seam between grid points.
  const across = Math.sqrt(w * w + SEAM * SEAM) - SEAM;
  let d = (across - h) / Math.sqrt(1 + gu * gu + gv * gv);
  // The beard's locks, cut down its length on every face.
  const b = PROFILE.beard;
  const locks = smoothstep(b.belowV + 0.05, b.belowV - 0.05, v) * smoothstep(b.frontOfU - 0.02, b.frontOfU + 0.06, u);
  if (locks > 0) d += 0.014 * Math.cos((Math.PI * w) / 0.045) ** 2 * locks;
  d = smin(d, earSdf(p, 1), 0.04);
  d = smin(d, earSdf(p, -1), 0.04);
  const n = PROFILE.nostril;
  for (const side of [1, -1]) d = smax(d, -sdEllipsoid(p, [n.u, n.v, n.w * side], [0.032, 0.048, 0.03]), 0.012);
  return Math.max(d, -(v + PROFILE.footSink));
}

/** A box round the head, ears and all, with a margin. */
export function headBounds(_bp: Blueprint): { min: V3; max: V3 } {
  return { min: [-0.95, -0.12, -0.92], max: [1.75, 2.62, 0.92] };
}
