import * as THREE from 'three';
import type { Blueprint, HornStation } from './blueprint';
import { fromBufferGeometry, type GeometryData } from './headGeometry';

/** The blueprint's 41 stations resampled evenly along t, so the ridges are resolved. */
function resample(stations: HornStation[], steps: number): HornStation[] {
  const out: HornStation[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let k = 0;
    while (k < stations.length - 2 && stations[k + 1]!.t < t) k++;
    const a = stations[k]!;
    const b = stations[k + 1]!;
    const f = b.t === a.t ? 0 : Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
    const mix = (p: number, q: number) => p + (q - p) * f;
    const nu = mix(a.normal[0], b.normal[0]);
    const nv = mix(a.normal[1], b.normal[1]);
    const nl = Math.hypot(nu, nv) || 1;
    out.push({
      t,
      s: mix(a.s, b.s),
      u: mix(a.u, b.u),
      v: mix(a.v, b.v),
      z: mix(a.z, b.z),
      depth: mix(a.depth, b.depth),
      width: mix(a.width, b.width),
      normal: [nu / nl, nv / nl],
    });
  }
  return out;
}

/** How much the ridges raise the surface at `t` (0 away from every ridge, the ridge height at its crest). */
function ridgeLift(ridges: { t: number; height: number }[], t: number): number {
  let lift = 0;
  ridges.forEach((ridge, i) => {
    const prev = ridges[i - 1]?.t ?? 0;
    const next = ridges[i + 1]?.t ?? 1;
    const halfWidth = 0.5 * Math.min(ridge.t - prev, next - ridge.t);
    const d = Math.abs(t - ridge.t);
    if (d < halfWidth) lift = Math.max(lift, ridge.height * (1 - d / halfWidth));
  });
  return lift;
}

/**
 * One horn, swept along the blueprint stations with an oval section: `depth` along the station's
 * normal in the u-v plane (the outer face), `width` sideways. The ridges sit on the outer face.
 * `side` +1 is the +w horn, −1 its mirror. Head-local axes, like the head.
 */
export function buildHorn(bp: Blueprint, side: 1 | -1, budget = 6000): GeometryData {
  const around = budget >= 5000 ? 16 : 12;
  const steps = Math.min(160, Math.floor((budget - around) / (2 * around)));
  const stations = resample(bp.heads.horn.stations, steps);
  const ridges = bp.heads.horn.ridges.list;

  const position: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  stations.forEach((st, i) => {
    const lift = ridgeLift(ridges, st.t);
    for (let j = 0; j < around; j++) {
      const a = (2 * Math.PI * j) / around;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const out = st.depth / 2 + (c > 0 ? lift * c : 0);
      position.push(st.u + c * out * st.normal[0], st.v + c * out * st.normal[1], side * (st.z + s * (st.width / 2)));
      uv.push(j / around, st.t);
    }
  });
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < around; j++) {
      const a = i * around + j;
      const b = i * around + ((j + 1) % around);
      const c = a + around;
      const d = b + around;
      if (side > 0) index.push(a, c, b, b, c, d);
      else index.push(a, b, c, b, d, c);
    }
  }
  // Caps at the root (hidden in the skull) and the tip.
  const root = stations[0]!;
  const rootCentre = position.length / 3;
  position.push(root.u, root.v, side * root.z);
  uv.push(0.5, 0);
  const tipSt = stations[steps]!;
  const tipCentre = position.length / 3;
  position.push(tipSt.u, tipSt.v, side * tipSt.z);
  uv.push(0.5, 1);
  const base = steps * around;
  for (let j = 0; j < around; j++) {
    const n = (j + 1) % around;
    if (side > 0) index.push(rootCentre, j, n, tipCentre, base + n, base + j);
    else index.push(rootCentre, n, j, tipCentre, base + j, base + n);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  return fromBufferGeometry(g);
}
