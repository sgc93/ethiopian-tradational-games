import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Blueprint } from './blueprint';

/** Material slots of the body geometry's groups. */
export const BODY_GROUP = { wood: 0, sides: 1, bowls: 2 } as const;

export type Detail = 'full' | 'half';

/** The board's plan: a stadium (two half-discs joined by straights), inset by `inset`. */
export function stadiumShape(bp: Blueprint, inset = 0): THREE.Shape {
  const r = bp.body.halfWidth - inset;
  const ex = bp.body.endCentreX;
  const shape = new THREE.Shape();
  shape.moveTo(-ex, -r);
  shape.lineTo(ex, -r);
  shape.absarc(ex, 0, r, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(-ex, r);
  shape.absarc(-ex, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
  return shape;
}

/**
 * The profile of a bowl as (r, y) points from the bottom on the axis up to the rim on the top face:
 * a spherical cap, then a small rounding of radius `rim` into the top surface.
 */
export function capProfile(radius: number, depth: number, sphereRadius: number, segments: number, rim = 0): [number, number][] {
  const centreY = sphereRadius - depth;
  const topAngle = Math.asin(Math.min(1, Math.max(-1, (-rim - centreY) / sphereRadius)));
  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = -Math.PI / 2 + ((topAngle + Math.PI / 2) * i) / segments;
    pts.push([sphereRadius * Math.cos(a), centreY + sphereRadius * Math.sin(a)]);
  }
  if (rim > 0) {
    const [r1] = pts[pts.length - 1]!;
    const n = Math.max(2, Math.round(segments / 3));
    for (let i = 1; i <= n; i++) {
      const a = Math.PI - (Math.PI / 2) * (i / n);
      pts.push([r1 + rim + rim * Math.cos(a), -rim + rim * Math.sin(a)]);
    }
  } else {
    pts[pts.length - 1] = [pts[pts.length - 1]![0], 0];
  }
  return pts;
}

function lathe(profile: [number, number][], segments: number): THREE.BufferGeometry {
  // Reversed so the faces look into the bowl rather than out of it.
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y)).reverse();
  return new THREE.LatheGeometry(pts, segments);
}

function sideStrip(bp: Blueprint, around: number): THREE.BufferGeometry {
  const { thickness, topEdgeRadius: tr, bottomEdgeRadius: br } = bp.body;
  // Profile rows as (inset, y): the top rounding, the flat side, the bottom rounding.
  const rows: [number, number][] = [];
  for (let i = 0; i <= 3; i++) {
    const a = (Math.PI / 2) * (i / 3);
    rows.push([tr - tr * Math.sin(a), -tr + tr * Math.cos(a)]);
  }
  rows.push([0, -thickness + br]);
  for (let i = 1; i <= 2; i++) {
    const a = (Math.PI / 2) * (i / 2);
    rows.push([br - br * Math.cos(a), -thickness + br - br * Math.sin(a)]);
  }
  const rings = rows.map(([inset]) => stadiumShape(bp, inset).getSpacedPoints(around));
  const position: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  rings.forEach((ring, r) => {
    const y = rows[r]![1];
    ring.forEach((p, i) => {
      position.push(p.x, y, -p.y);
      uv.push(i / around, (y + thickness) / thickness);
    });
  });
  const stride = around + 1;
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < around; i++) {
      const a = r * stride + i;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

function foot(bp: Blueprint, x: number, z: number): THREE.BufferGeometry {
  const { size, height, chamfer } = bp.feet;
  const top = -bp.body.thickness;
  const body = new THREE.BoxGeometry(size, height - chamfer, size).translate(x, top - (height - chamfer) / 2, z);
  const toe = new THREE.BoxGeometry(size - 2 * chamfer, chamfer, size - 2 * chamfer).translate(x, top - height + chamfer / 2, z);
  return mergeGeometries([body, toe], false)!;
}

/** Flattens a shape geometry (drawn in the xy plane) onto the xz plane at height `y`, facing up or down. */
function flat(shape: THREE.Shape, segments: number, y: number, up: boolean): THREE.BufferGeometry {
  const g = new THREE.ShapeGeometry(shape, segments);
  g.rotateX(up ? -Math.PI / 2 : Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

/**
 * The board body from the blueprint, without the heads: the top face with its 14 bowls, the
 * rounded sides, the bottom and the four feet. Three groups: wood, sides (for the band) and bowls.
 */
export function buildBoardBody(bp: Blueprint, detail: Detail = 'full'): THREE.BufferGeometry {
  const k = detail === 'full' ? 1 : 0.5;
  const curve = Math.round(16 * k);
  const latheSegments = Math.round(40 * k);
  const profileSegments = Math.round(14 * k);

  const cup = capProfile(bp.cups.diameter / 2, bp.cups.depth, bp.cups.sphereRadius, profileSegments, bp.cups.rimRadius);
  const store = capProfile(bp.stores.diameter / 2, bp.stores.depth, bp.stores.sphereRadius, profileSegments, bp.stores.rimRadius);

  const top = stadiumShape(bp, bp.body.topEdgeRadius);
  const holes = [
    ...bp.cups.holes.map((c) => ({ x: c.x, z: c.z, r: cup[cup.length - 1]![0] })),
    ...bp.stores.list.map((s) => ({ x: s.x, z: s.z, r: store[store.length - 1]![0] })),
  ];
  for (const h of holes) {
    const path = new THREE.Path();
    path.absarc(h.x, -h.z, h.r, 0, Math.PI * 2, true);
    top.holes.push(path);
  }

  const wood = mergeGeometries(
    [
      flat(top, curve, 0, true),
      flat(stadiumShape(bp, bp.body.bottomEdgeRadius), curve, -bp.body.thickness, false),
      ...bp.feet.list.map((f) => foot(bp, f.x, f.z)),
    ],
    false,
  )!;
  const sides = sideStrip(bp, Math.round(bp.band.repeats * 8 * k));
  const bowls = mergeGeometries(
    [
      ...bp.cups.holes.map((c) => lathe(cup, latheSegments).translate(c.x, 0, c.z)),
      ...bp.stores.list.map((s) => lathe(store, latheSegments).translate(s.x, 0, s.z)),
    ],
    false,
  )!;

  const merged = mergeGeometries([wood, sides, bowls], true)!;
  merged.groups.forEach((group, i) => (group.materialIndex = i));
  return merged;
}
