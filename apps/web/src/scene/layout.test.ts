import * as THREE from 'three';
import { expect, test } from 'vitest';
import {
  boardCorners,
  bowlSurfaceY,
  HOLE_RADIUS,
  holeCenter,
  pileSlot,
  seatCamera,
  STONE_SIZE,
  stoneSlot,
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

test('holes run counter-clockwise from above', () => {
  expect(holeCenter(0)[0]).toBeLessThan(holeCenter(5)[0]);
  expect(holeCenter(6)[0]).toBeGreaterThan(holeCenter(11)[0]);
  expect(holeCenter(0)[2]).toBeGreaterThan(0);
  expect(holeCenter(6)[2]).toBeLessThan(0);
  expect(holeCenter(0)).toEqual([-2.5, 0, 0.575]);
  expect(holeCenter(6)).toEqual([2.5, 0, -0.575]);
});

test('stoneSlot keeps every stone in or above the bowl', () => {
  for (const n of [1, 4, 12, 20, 48]) {
    for (let i = 0; i < n; i++) {
      const [x, y, z] = stoneSlot(3, i);
      const [cx, , cz] = holeCenter(3);
      const d = Math.hypot(x - cx, z - cz);
      expect(d).toBeLessThanOrEqual(HOLE_RADIUS * 0.85);
      expect(y).toBeGreaterThanOrEqual(bowlSurfaceY(d) + STONE_SIZE * 0.4);
    }
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

test('captured stones lie beside their own player, apart from the holes', () => {
  expect(pileSlot(0, 0)[2]).toBeGreaterThan(holeCenter(0)[2] + HOLE_RADIUS);
  expect(pileSlot(1, 0)[2]).toBeLessThan(holeCenter(6)[2] - HOLE_RADIUS);
  // Groups of four: stone 4 starts a new group, further from stone 3 than stones in one group are.
  expect(dist(pileSlot(0, 3), pileSlot(0, 4))).toBeGreaterThan(dist(pileSlot(0, 0), pileSlot(0, 3)));
});

test('seat camera frames the board at portrait aspect', () => {
  for (const aspect of [360 / 640, 16 / 9]) {
    for (const p of [0, 1] as const) {
      const cam = toThreeCamera(seatCamera(p, aspect), aspect);
      for (const corner of boardCorners()) {
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
