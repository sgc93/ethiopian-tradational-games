import * as THREE from 'three';
import { expect, test } from 'vitest';
import {
  bowlSurfaceY,
  fitPoints,
  HOLE_DEPTH,
  HOLE_RADIUS,
  holeCenter,
  seatCamera,
  STONE_SIZE,
  STORE_DEPTH,
  STORE_RADIUS,
  STORE_X,
  stoneSlot,
  storeCenter,
  storeSlot,
  type Vec3,
} from './layout';

function toThreeCamera(seat: { position: Vec3; target: Vec3; fov: number }, aspect: number) {
  const cam = new THREE.PerspectiveCamera(seat.fov, aspect, 0.1, 100);
  cam.position.set(...seat.position);
  cam.lookAt(new THREE.Vector3(...seat.target));
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
}

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

test('blueprint sizes', () => {
  expect(HOLE_RADIUS).toBe(0.44);
  expect(HOLE_DEPTH).toBe(0.36);
  expect(STONE_SIZE).toBe(0.2);
  expect(STORE_X).toBe(3.75);
});

test('holes run counter-clockwise from above', () => {
  expect(holeCenter(0)[0]).toBeLessThan(holeCenter(5)[0]);
  expect(holeCenter(6)[0]).toBeGreaterThan(holeCenter(11)[0]);
  expect(holeCenter(0)[2]).toBeGreaterThan(0);
  expect(holeCenter(6)[2]).toBeLessThan(0);
  expect(holeCenter(0)).toEqual([-2.5, 0, 0.575]);
  expect(holeCenter(6)).toEqual([2.5, 0, -0.575]);
});

test('stones heap inside a cup', () => {
  for (let slot = 0; slot < 20; slot++) {
    const [x, y, z] = stoneSlot(3, slot);
    const [cx, , cz] = holeCenter(3);
    const d = Math.hypot(x - cx, z - cz);
    expect(d).toBeLessThan(HOLE_RADIUS - STONE_SIZE * 0.35);
    expect(y).toBeGreaterThanOrEqual(bowlSurfaceY(d) + STONE_SIZE * 0.4);
    expect(y).toBeGreaterThan(-HOLE_DEPTH);
    expect(y).toBeLessThan(0.45);
  }
});

test('the first 4 stones in a hole do not overlap', () => {
  for (let h = 0; h < 12; h++) {
    const s = [0, 1, 2, 3].map((i) => stoneSlot(h, i));
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) expect(dist(s[i]!, s[j]!)).toBeGreaterThanOrEqual(STONE_SIZE * 0.9);
    }
  }
});

test("captured stones go into the owner's store", () => {
  expect(storeCenter(0)).toEqual([STORE_X, 0, 0]);
  expect(storeCenter(1)).toEqual([-STORE_X, 0, 0]);
  for (let i = 0; i < 24; i++) {
    const [x, y, z] = storeSlot(0, i);
    expect(Math.hypot(x - STORE_X, z)).toBeLessThan(STORE_RADIUS - STONE_SIZE * 0.35);
    expect(y).toBeGreaterThan(-STORE_DEPTH);
    expect(y).toBeLessThan(0.5);
    expect(storeSlot(1, i)[0]).toBeCloseTo(-x);
  }
});

test('fit points cover the horns', () => {
  const pts = fitPoints();
  // The horn tips are the widest part of the heads; the body itself is wider still (±1.28).
  expect(Math.max(...pts.filter((p) => p[1] > 1.2).map((p) => Math.abs(p[2])))).toBeCloseTo(1.135, 2);
  expect(Math.max(...pts.map((p) => Math.abs(p[2])))).toBeCloseTo(1.28, 2);
  expect(Math.max(...pts.map((p) => p[1]))).toBeGreaterThan(3.1);
  expect(Math.min(...pts.map((p) => p[1]))).toBe(-1.8);
});

test('seat camera frames the whole board', () => {
  for (const aspect of [360 / 640, 16 / 9]) {
    for (const p of [0, 1] as const) {
      const cam = toThreeCamera(seatCamera(p, aspect), aspect);
      for (const corner of fitPoints()) {
        const v = new THREE.Vector3(...corner).project(cam);
        expect(Math.abs(v.x)).toBeLessThanOrEqual(0.95);
        expect(Math.abs(v.y)).toBeLessThanOrEqual(0.95);
      }
    }
  }
});

test('each seat looks from its own side', () => {
  expect(seatCamera(0, 1.5).position[2]).toBeGreaterThan(0);
  expect(seatCamera(1, 1.5).position[2]).toBeLessThan(0);
});
