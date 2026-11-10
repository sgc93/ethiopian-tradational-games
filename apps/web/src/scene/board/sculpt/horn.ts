import type { Blueprint } from '../blueprint';
import type { PackedMesh } from './pack';
import type { V3 } from './sdf';

/**
 * A horn as a swept tube along the blueprint's 41 stations: a squared oval section (its depth in the
 * side view, its width in the front view) that narrows to the point, the 24 knuckled ridges
 * standing on its front face. The root is carried down into the skull until it is buried, so the
 * horn grows out of the head with no gap and nothing pokes through the face.
 */
export interface HornOptions {
  /** Points round each section. */
  sides: number;
  /** Sections across each ridge, from valley to valley. */
  perRidge: number;
  /** The step in t along the smooth stretches, before the first ridge and after the last. */
  step: number;
}

interface Section {
  t: number;
  centre: V3;
  n: V3;
  b: V3;
  /** Half-depth (along n) and half-width (along b) of the oval under the ridges. */
  rn: number;
  rb: number;
  knob: number;
}

/**
 * How far out the horn's centre line stands at t, measured on the front reference (image 08):
 * the horns rise close together from the brow, swing out to about 1.3 units either side and turn
 * their tips back in, a lyre. The blueprint's stations carry a plainer spread; the side-view path,
 * depths and widths are still the blueprint's.
 */
const FRONT_Z: [number, number][] = [
  [0, 0.2], [0.05, 0.3], [0.1, 0.38], [0.15, 0.47], [0.2, 0.58], [0.25, 0.7], [0.3, 0.82], [0.35, 0.94], [0.4, 1.04],
  [0.45, 1.13], [0.5, 1.21], [0.55, 1.27], [0.6, 1.3], [0.65, 1.31], [0.7, 1.31], [0.75, 1.29], [0.8, 1.25], [0.85, 1.18],
  [0.9, 1.08], [0.95, 0.98], [1, 0.92],
];

/** The ridges stand this much prouder than the blueprint's measure, as bold as the carving's. */
const KNOB_SCALE = 1.8;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function normalize(a: V3): V3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

function catmull(p0: number, p1: number, p2: number, p3: number, s: number): number {
  return 0.5 * (2 * p1 + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s + (-p0 + 3 * p1 - 3 * p2 + p3) * s * s * s);
}

function frontZ(t: number): number {
  const x = clamp01(t) * (FRONT_Z.length - 1);
  const i = Math.min(FRONT_Z.length - 2, Math.floor(x));
  const at = (k: number) => FRONT_Z[Math.min(FRONT_Z.length - 1, Math.max(0, k))]![1];
  return catmull(at(i - 1), at(i), at(i + 1), at(i + 2), x - i);
}

/** The station values at t, smoothly interpolated: u, v, z, depth, width and the side-view normal. */
function station(bp: Blueprint, t: number) {
  const st = bp.heads.horn.stations;
  const x = clamp01(t) * (st.length - 1);
  const i = Math.min(st.length - 2, Math.floor(x));
  const s = x - i;
  const at = (k: number) => st[Math.min(st.length - 1, Math.max(0, k))]!;
  const f = (get: (h: (typeof st)[number]) => number) => catmull(get(at(i - 1)), get(at(i)), get(at(i + 1)), get(at(i + 2)), s);
  return {
    u: f((h) => h.u),
    v: f((h) => h.v),
    z: frontZ(t),
    depth: Math.max(0.03, f((h) => h.depth)) * (1 + 0.26 * smoothstep(0.06, 0.24, clamp01(t)) * (1 - smoothstep(0.5, 1, clamp01(t)))),
    width: Math.max(0.03, f((h) => h.width)) * (1 + 0.42 * smoothstep(0.06, 0.24, clamp01(t)) * (1 - smoothstep(0.45, 1, clamp01(t)))),
    normal: [f((h) => h.normal[0]), f((h) => h.normal[1])] as [number, number],
  };
}

/** The horn's centre line at t (0 at the root, 1 at the tip); side +1 is the horn on the +w side. */
export function hornCentre(bp: Blueprint, side: 1 | -1, t: number): V3 {
  const s = station(bp, t);
  return [s.u, s.v, s.z * side];
}

/** How far the ridges stand off the front face at t: rounded knuckles with narrow valleys between. */
export function hornKnob(bp: Blueprint, t: number): number {
  const list = bp.heads.horn.ridges.list;
  let best = 0;
  for (let i = 0; i < list.length; i++) {
    const r = list[i]!;
    const prev = list[i - 1]?.t ?? r.t - (list[1]!.t - list[0]!.t);
    const next = list[i + 1]?.t ?? r.t + (r.t - list[i - 1]!.t);
    const x = (t - r.t) / ((next - prev) / 2);
    if (Math.abs(x) < 0.5) best = Math.max(best, KNOB_SCALE * r.height * Math.cos(Math.PI * x) ** 0.55);
  }
  return best;
}

/** The ridges' height round t (their envelope, not the knuckles), which the section gives up to them. */
function ridgeEnvelope(bp: Blueprint, t: number): number {
  const list = bp.heads.horn.ridges.list;
  const first = list[0]!;
  const last = list.at(-1)!;
  if (t <= first.t) return KNOB_SCALE * first.height * smoothstep(0, first.t, t);
  if (t >= last.t) return KNOB_SCALE * last.height * smoothstep(1, last.t, t);
  for (let i = 1; i < list.length; i++) {
    const a = list[i - 1]!;
    const b = list[i]!;
    if (t <= b.t) return KNOB_SCALE * (a.height + ((b.height - a.height) * (t - a.t)) / (b.t - a.t));
  }
  return 0;
}

function section(bp: Blueprint, side: 1 | -1, t: number): Section {
  const s = station(bp, t);
  const ahead = hornCentre(bp, side, Math.min(1, t + 0.002));
  const behind = hornCentre(bp, side, Math.max(0, t - 0.002));
  const tangent = normalize([ahead[0] - behind[0], ahead[1] - behind[1], ahead[2] - behind[2]]);
  const raw: V3 = [s.normal[0], s.normal[1], 0];
  const n = normalize(add(raw, tangent, -dot(raw, tangent)));
  const b = normalize(cross(tangent, n));
  const ridge = ridgeEnvelope(bp, t);
  return {
    t,
    centre: add([s.u, s.v, s.z * side], n, -ridge / 2),
    n,
    b,
    rn: Math.max(0.012, (s.depth - ridge) / 2),
    rb: Math.max(0.012, s.width / 2),
    knob: hornKnob(bp, t),
  };
}

/** The t of every section: even steps along the smooth stretches, and `perRidge` across each ridge. */
function stations(bp: Blueprint, o: HornOptions): number[] {
  const list = bp.heads.horn.ridges.list;
  const spacing = (i: number) => {
    const prev = list[i - 1]?.t ?? list[i]!.t - (list[1]!.t - list[0]!.t);
    const next = list[i + 1]?.t ?? list[i]!.t + (list[i]!.t - list[i - 1]!.t);
    return (next - prev) / 2;
  };
  const start = list[0]!.t - spacing(0) / 2;
  const end = list.at(-1)!.t + spacing(list.length - 1) / 2;
  const ts: number[] = [];
  for (let t = 0; t < start - o.step / 2; t += o.step) ts.push(t);
  for (let i = 0; i < list.length; i++) {
    for (let k = 0; k < o.perRidge; k++) ts.push(list[i]!.t + spacing(i) * (-0.5 + k / o.perRidge));
  }
  for (let t = end; t < 1; t += o.step) ts.push(t);
  ts.push(1);
  return ts;
}

/**
 * Builds one horn. `inside` is the head's field (negative inside); the root is carried down and
 * forward into it until every point of its section is buried.
 */
export function buildHorn(bp: Blueprint, side: 1 | -1, o: HornOptions, inside: (p: V3) => number): PackedMesh {
  const sections = stations(bp, o).map((t) => section(bp, side, t));
  const ring = (sec: Section): V3[] => {
    const pts: V3[] = [];
    for (let j = 0; j < o.sides; j++) {
      const a = (2 * Math.PI * j) / o.sides;
      const c = Math.cos(a);
      const lift = sec.knob * smoothstep(-0.25, 0.55, c);
      // The sides are flatter than an oval's, as a horn's are: the section is squared a little.
      const sn = Math.sin(a);
      const flat = Math.sign(sn) * Math.abs(sn) ** 0.72;
      pts.push(add(add(sec.centre, sec.n, sec.rn * c + lift), sec.b, sec.rb * flat));
    }
    return pts;
  };

  // Carry the root into the skull: down, and a little back along the horn's own line.
  const root = sections[0]!;
  const forward = normalize([sections[1]!.centre[0] - root.centre[0], sections[1]!.centre[1] - root.centre[1], sections[1]!.centre[2] - root.centre[2]]);
  const sink = normalize(add([0, -0.7, 0], forward, -0.3));
  const buried: Section[] = [];
  for (let k = 1; k <= 40; k++) {
    const sec = { ...root, t: 0, knob: 0, centre: add(root.centre, sink, 0.02 * k) };
    buried.unshift(sec);
    if (ring(sec).every((p) => inside(p) < -0.012)) break;
  }
  const all = [...buried, ...sections];

  const position: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  const cols = o.sides + 1; // the seam's column repeated for the uvs
  for (const sec of all) {
    const pts = ring(sec);
    for (let j = 0; j <= o.sides; j++) {
      position.push(...pts[j % o.sides]!);
      uv.push(j / o.sides, clamp01(sec.t));
    }
  }
  for (let i = 0; i < all.length - 1; i++) {
    for (let j = 0; j < o.sides; j++) {
      const a = i * cols + j;
      const b = a + cols;
      index.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  // Caps: a point at the buried root, and the tip carried a little past the last section.
  const first = all[0]!;
  const last = all.at(-1)!;
  const rootAt = position.length / 3;
  position.push(...first.centre);
  uv.push(0.5, 0);
  const lastTangent = normalize([last.centre[0] - all.at(-2)!.centre[0], last.centre[1] - all.at(-2)!.centre[1], last.centre[2] - all.at(-2)!.centre[2]]);
  const tipAt = rootAt + 1;
  position.push(...add(last.centre, lastTangent, 0.03));
  uv.push(0.5, 1);
  const lastRow = (all.length - 1) * cols;
  for (let j = 0; j < o.sides; j++) {
    index.push(rootAt, j, j + 1);
    index.push(tipAt, lastRow + j + 1, lastRow + j);
  }
  // The winding faces outward: check one triangle against the way out from the centre line.
  if (!facesOut(position, index, all[Math.floor(all.length / 2)]!.centre, Math.floor(all.length / 2) * cols)) {
    for (let k = 0; k < index.length; k += 3) [index[k + 1], index[k + 2]] = [index[k + 2]!, index[k + 1]!];
  }
  return { position: new Float32Array(position), normal: smoothNormals(position, index), uv: new Float32Array(uv), index: new Uint32Array(index) };
}

function facesOut(position: number[], index: number[], centre: V3, a: number): boolean {
  const k = index.findIndex((x, i) => i % 3 === 0 && x === a);
  const p = (i: number): V3 => [position[i * 3]!, position[i * 3 + 1]!, position[i * 3 + 2]!];
  const [p0, p1, p2] = [p(index[k]!), p(index[k + 1]!), p(index[k + 2]!)];
  const nrm = cross([p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]]);
  return dot(nrm, [p0[0] - centre[0], p0[1] - centre[1], p0[2] - centre[2]]) > 0;
}

/** Area-weighted vertex normals, shared by every vertex at the same point so the uv seam does not show. */
function smoothNormals(position: number[], index: number[]): Float32Array {
  const acc = new Float32Array(position.length);
  const groups = new Map<string, number>();
  const group: number[] = [];
  for (let i = 0; i < position.length / 3; i++) {
    const key = `${position[i * 3]},${position[i * 3 + 1]},${position[i * 3 + 2]}`;
    let g = groups.get(key);
    if (g === undefined) {
      g = i;
      groups.set(key, i);
    }
    group.push(g);
  }
  for (let k = 0; k < index.length; k += 3) {
    const [a, b, c] = [index[k]!, index[k + 1]!, index[k + 2]!];
    const p = (i: number): V3 => [position[i * 3]!, position[i * 3 + 1]!, position[i * 3 + 2]!];
    const [pa, pb, pc] = [p(a), p(b), p(c)];
    const n = cross([pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]], [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]]);
    for (const v of [a, b, c]) {
      for (let j = 0; j < 3; j++) {
        const k = group[v]! * 3 + j;
        acc[k] = acc[k]! + n[j]!;
      }
    }
  }
  const out = new Float32Array(position.length);
  for (let i = 0; i < position.length / 3; i++) {
    const g = group[i]!;
    const l = Math.hypot(acc[g * 3]!, acc[g * 3 + 1]!, acc[g * 3 + 2]!) || 1;
    for (let j = 0; j < 3; j++) out[i * 3 + j] = acc[g * 3 + j]! / l;
  }
  return out;
}
