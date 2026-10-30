import type { Blueprint } from '../blueprint';

/**
 * The Walia ibex head as a signed-distance sculpt (negative inside), in head-local units: u
 * forward to the muzzle, v up from the board's top, w sideways. Its proportions are read off the
 * carved references in docs/design/board/images (07 side, 08 front, 11 three-quarter, 12 horn)
 * and its overall size from the blueprint; `mesh.ts` meshes it offline.
 */

export type V3 = [number, number, number];

/** The horns' tips sit this far apart (the master image's modest splay), not the blueprint's 1.96. */
export const HORN_TIP_SPACING = 1.3;

/**
 * Landmarks measured on the side reference (image 07), in head units, with the neck axis at u = 0
 * and the board's top at v = 0. The muzzle's reach is the blueprint's.
 */
export const PROFILE = {
  noseTipV: 1.05,
  mouthV: 0.9,
  chinV: 0.6,
  beardTipV: 0.45,
  eye: { u: 0.85, v: 1.65 },
  skullTopV: 2.14,
  earBase: { u: -0.15, v: 1.95 },
  neckFootHalfLength: 0.85,
};

const length = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Polynomial smooth minimum: a union with a fillet of about `k`. */
function smin(a: number, b: number, k: number): number {
  const h = clamp01(0.5 + (0.5 * (b - a)) / k);
  return b + (a - b) * h - k * h * (1 - h);
}
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);
/** Carves `b` out of `a` with a soft edge. */
const carve = (a: number, b: number, k: number) => smax(a, -b, k);

function sdSphere(p: V3, c: V3, r: number): number {
  return length(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - r;
}

/** An ellipsoid (a close bound, not the exact distance; fine for meshing). */
function sdEllipsoid(p: V3, c: V3, r: V3): number {
  const x = (p[0] - c[0]) / r[0];
  const y = (p[1] - c[1]) / r[1];
  const z = (p[2] - c[2]) / r[2];
  const k0 = length(x, y, z);
  const k1 = length(x / r[0], y / r[1], z / r[2]);
  return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
}

/** A capsule from `a` to `b` whose radius runs from `ra` to `rb`, with `w` squeezed by `wScale`. */
function sdTaperedCapsule(p: V3, a: V3, b: V3, ra: number, rb: number, wScale = 1): number {
  const px = p[0] - a[0];
  const py = p[1] - a[1];
  const pz = (p[2] - a[2]) / wScale;
  const bx = b[0] - a[0];
  const by = b[1] - a[1];
  const bz = (b[2] - a[2]) / wScale;
  const bb = bx * bx + by * by + bz * bz;
  const t = bb === 0 ? 0 : clamp01((px * bx + py * by + pz * bz) / bb);
  const r = ra + (rb - ra) * t;
  return (length(px - bx * t, py - by * t, pz - bz * t) - r) * Math.min(1, wScale);
}

function sdBox(p: V3, c: V3, half: V3): number {
  const qx = Math.abs(p[0] - c[0]) - half[0];
  const qy = Math.abs(p[1] - c[1]) - half[1];
  const qz = Math.abs(p[2] - c[2]) - half[2];
  return length(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0);
}

/** One ear: a leaf-shaped ellipsoid standing on its base, tilted back and splayed out. */
function sdEar(p: V3, side: 1 | -1): number {
  const base: V3 = [PROFILE.earBase.u, PROFILE.earBase.v, side * 0.3];
  const tilt = (-35 * Math.PI) / 180; // back, towards −u
  const splay = (25 * Math.PI) / 180; // out
  let x = p[0] - base[0];
  let y = p[1] - base[1];
  let z = (p[2] - base[2]) * side;
  const cz = Math.cos(splay);
  const sz = Math.sin(splay);
  [y, z] = [y * cz + z * sz, -y * sz + z * cz];
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  [x, y] = [x * ct - y * st, x * st + y * ct];
  const half = 0.26;
  return sdEllipsoid([x, y, z], [0, half, 0], [0.09, half, 0.2]);
}

/** The head without its horns. */
export function headSdf(bp: Blueprint, p: V3): number {
  const noseTip = bp.heads.measures.muzzle;
  const { noseTipV, mouthV, chinV, beardTipV, eye, earBase, neckFootHalfLength } = PROFILE;

  // The neck: a thick wedge, deeper fore-and-aft than it is wide, leaning a little forward and
  // flaring to its foot; the throat runs up and forward under the jaw.
  let d = sdTaperedCapsule(p, [-0.1, -0.4, 0], [0.25, 1.55, 0], 0.72, 0.5, 0.6);
  d = smin(d, sdEllipsoid(p, [0, -0.1, 0], [neckFootHalfLength, 0.3, 0.45]), 0.25);
  d = smin(d, sdTaperedCapsule(p, [0.25, 0.6, 0], [0.95, 1.0, 0], 0.45, 0.32, 0.7), 0.15);
  // The skull, the forehead and the brow.
  d = smin(d, sdEllipsoid(p, [0.1, 1.72, 0], [0.72, 0.42, 0.4]), 0.15);
  d = smin(d, sdEllipsoid(p, [0.5, 1.85, 0], [0.45, 0.32, 0.36]), 0.1);
  // The muzzle: long, deep at the eyes, sloping down to the nose, with the jaw under it.
  d = smin(d, sdTaperedCapsule(p, [0.55, 1.65, 0], [noseTip - 0.3, noseTipV + 0.1, 0], 0.42, 0.26, 0.78), 0.1);
  d = smin(d, sdSphere(p, [noseTip - 0.2, noseTipV + 0.03, 0], 0.2), 0.06);
  d = smin(d, sdTaperedCapsule(p, [0.45, 1.3, 0], [noseTip - 0.4, mouthV + 0.05, 0], 0.34, 0.22, 0.85), 0.08);
  // The beard: a tuft hanging from the chin.
  d = smin(d, sdTaperedCapsule(p, [1.05, chinV + 0.3, 0], [0.95, beardTipV, 0], 0.13, 0.03), 0.05);
  for (const side of [1, -1] as const) {
    // A brow ridge over each eye; the eye is a socket carved out with the eyeball standing in it.
    d = smin(d, sdEllipsoid(p, [eye.u - 0.15, eye.v + 0.17, side * 0.26], [0.25, 0.09, 0.15]), 0.05);
    d = carve(d, sdEllipsoid(p, [eye.u, eye.v, side * 0.33], [0.17, 0.1, 0.09]), 0.02);
    d = smin(d, sdSphere(p, [eye.u, eye.v, side * 0.27], 0.12), 0.02);
    // A nostril in each side of the nose.
    d = carve(d, sdSphere(p, [noseTip - 0.13, noseTipV, side * 0.16], 0.06), 0.015);
    // An ear.
    d = smin(d, sdEar(p, side), 0.04);
  }
  // The mouth: a thin slit along the muzzle's underside.
  d = carve(d, sdBox(p, [noseTip - 0.4, mouthV, 0], [0.3, 0.012, 0.25]), 0.01);
  // The foot is flat on the board.
  void earBase;
  return Math.max(d, 0.0 - p[1]);
}

/** A loose box round the head, for the mesher's grid. */
export function headBounds(bp: Blueprint): { min: V3; max: V3 } {
  return { min: [-1.1, -0.08, -0.9], max: [bp.heads.measures.muzzle + 0.25, bp.heads.measures.earTipV + 0.4, 0.9] };
}

interface Sample {
  u: number;
  v: number;
  z: number;
  t: number;
  depth: number;
  width: number;
  n: [number, number];
}

const sampleCache = new WeakMap<Blueprint, Sample[]>();

/** The horn's centre line, densely resampled, with the sideways offset remapped to the narrower splay. */
function hornSamples(bp: Blueprint): Sample[] {
  let cached = sampleCache.get(bp);
  if (cached) return cached;
  const stations = bp.heads.horn.stations;
  const root = stations[0]!.z;
  const tip = HORN_TIP_SPACING / 2;
  const steps = 240;
  cached = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let k = 0;
    while (k < stations.length - 2 && stations[k + 1]!.t < t) k++;
    const a = stations[k]!;
    const b = stations[k + 1]!;
    const f = b.t === a.t ? 0 : clamp01((t - a.t) / (b.t - a.t));
    const mix = (x: number, y: number) => x + (y - x) * f;
    const nu = mix(a.normal[0], b.normal[0]);
    const nv = mix(a.normal[1], b.normal[1]);
    const nl = Math.hypot(nu, nv) || 1;
    cached.push({
      t,
      u: mix(a.u, b.u),
      v: mix(a.v, b.v),
      z: root + (tip - root) * Math.pow(t, 0.9),
      depth: mix(a.depth, b.depth),
      width: mix(a.width, b.width),
      n: [nu / nl, nv / nl],
    });
  }
  sampleCache.set(bp, cached);
  return cached;
}

/** How much the ridges raise the outer face at `t`: a broad rounded knuckle at each ridge. */
function ridgeLift(bp: Blueprint, t: number): number {
  const ridges = bp.heads.horn.ridges.list;
  let lift = 0;
  for (let i = 0; i < ridges.length; i++) {
    const r = ridges[i]!;
    const prev = ridges[i - 1]?.t ?? 0;
    const next = ridges[i + 1]?.t ?? 1;
    const halfWidth = 0.5 * Math.min(r.t - prev, next - r.t);
    const d = Math.abs(t - r.t);
    if (d < halfWidth) lift = Math.max(lift, r.height * 1.4 * (0.5 + 0.5 * Math.cos((Math.PI * d) / halfWidth)));
  }
  return lift;
}

/**
 * One horn: an oval section swept along the blueprint's centre line (deeper along the curve's
 * normal than it is wide), the 24 ridges standing on its outer face, tapering to the tip. `side`
 * +1 is the +w horn, −1 its mirror.
 */
export function hornSdf(bp: Blueprint, side: 1 | -1, p: V3): number {
  const samples = hornSamples(bp);
  const u = p[0];
  const v = p[1];
  const w = p[2] * side;
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]!;
    const d = (u - s.u) ** 2 + (v - s.v) ** 2 + (w - s.z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const s = samples[best]!;
  const qu = u - s.u;
  const qv = v - s.v;
  const qw = w - s.z;
  const qn = qu * s.n[0] + qv * s.n[1];
  const tangentU = -s.n[1];
  const tangentV = s.n[0];
  const qt = qu * tangentU + qv * tangentV;
  const a = s.depth / 2 + (qn > 0 ? ridgeLift(bp, s.t) : 0);
  const b = s.width / 2;
  const radial = Math.sqrt((qn / a) ** 2 + (qw / b) ** 2);
  const section = (radial - 1) * Math.min(a, b);
  const past = best === samples.length - 1 && qt > 0 ? qt : 0;
  return Math.max(section, past > 0 ? Math.hypot(Math.max(section, 0), past) : section);
}

/** A loose box round one horn. */
export function hornBounds(bp: Blueprint, side: 1 | -1): { min: V3; max: V3 } {
  const samples = hornSamples(bp);
  const m = 0.45;
  let min: V3 = [Infinity, Infinity, Infinity];
  let max: V3 = [-Infinity, -Infinity, -Infinity];
  for (const s of samples) {
    const z = s.z * side;
    min = [Math.min(min[0], s.u - m), Math.min(min[1], s.v - m), Math.min(min[2], z - m)];
    max = [Math.max(max[0], s.u + m), Math.max(max[1], s.v + m), Math.max(max[2], z + m)];
  }
  return { min, max };
}
