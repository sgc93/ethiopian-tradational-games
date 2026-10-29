import { expect, test } from 'vitest';
import { fitPoints, type Vec3 } from '../layout';
import { defaultBands, homePose, orbitPose, playCamera, project, seatArc, topCamera, type Bands } from './poses';

const S = { width: 844, height: 390 };
const B: Bands = { top: 56, bottom: 313 };
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

test('844×390 play view matches the mockup framing', () => {
  const pose = playCamera(0, S, B);
  expect(pose.fov).toBe(30);
  expect(Math.hypot(...sub(pose.position, pose.target))).toBeCloseTo(16.25, 0);
  const xs = fitPoints().map((p) => project(pose, S, p));
  expect(Math.min(...xs.map((p) => p[0]))).toBeGreaterThanOrEqual(80);
  expect(Math.max(...xs.map((p) => p[0]))).toBeLessThanOrEqual(764);
  expect(Math.min(...xs.map((p) => p[1]))).toBeGreaterThanOrEqual(63);
  expect(Math.max(...xs.map((p) => p[1]))).toBeLessThanOrEqual(300);
});

test('seat B looks from the other side', () => {
  expect(playCamera(1, S, B).position[2]).toBeLessThan(0);
  expect(playCamera(0, S, B).position[2]).toBeGreaterThan(0);
});

test.each([
  [0.5, 400, 800],
  [3, 1800, 600],
])('aspect %s keeps the board inside the margins', (_, width, height) => {
  const bands = { top: 56, bottom: height - 77 };
  const pose = playCamera(0, { width, height }, bands);
  for (const p of fitPoints()) {
    const [x, y] = project(pose, { width, height }, p);
    expect(Number.isFinite(x)).toBe(true);
    expect(x).toBeGreaterThanOrEqual(width * 0.095 - 1);
    expect(x).toBeLessThanOrEqual(width * 0.905 + 1);
    expect(y).toBeGreaterThanOrEqual(bands.top + 6);
    expect(y).toBeLessThanOrEqual(bands.bottom - 12);
  }
});

test('a compact phone browser keeps the board between its bands', () => {
  const size = { width: 750, height: 300 };
  const bands = { top: 44, bottom: 256 };
  const pose = playCamera(0, size, bands);
  for (const p of fitPoints()) {
    const [, y] = project(pose, size, p);
    expect(y).toBeGreaterThanOrEqual(bands.top + 6);
    expect(y).toBeLessThanOrEqual(bands.bottom - 12);
  }
});

test('the top-down view looks almost straight down from 15.5', () => {
  const pose = topCamera(S, B);
  expect(Math.hypot(...sub(pose.position, pose.target))).toBeCloseTo(15.5, 2);
  expect(pose.position[1]).toBeGreaterThan(15);
  const [x, y] = project(pose, S, [0, 0, 0.05]);
  expect(x).toBeCloseTo(S.width / 2, 0);
  expect(y).toBeCloseTo(S.height / 2, 0);
});

test('home arc stays within ±25°, 2–5 above the top, at radius 22', () => {
  for (let t = 0; t < 60; t += 0.5) {
    const p = homePose(t);
    const az = (Math.atan2(p.position[0], p.position[2]) * 180) / Math.PI;
    expect(Math.abs(az)).toBeLessThanOrEqual(25.01);
    expect(p.position[1]).toBeGreaterThanOrEqual(2);
    expect(p.position[1]).toBeLessThanOrEqual(5);
    expect(Math.hypot(p.position[0], p.position[2])).toBeCloseTo(22, 1);
    expect(p.position[2]).toBeGreaterThan(0); // on A's side
  }
  homePose(0).position.forEach((v, i) => expect(v).toBeCloseTo(homePose(60).position[i]!, 9)); // once a minute
});

test('home camera clears every prop by 2', () => {
  const props = [
    [-32, 10],
    [-20, 9],
    [-20, -9],
    [-15, -11],
  ];
  for (let t = 0; t < 60; t += 0.5) {
    const p = homePose(t).position;
    for (const [x, z] of props) expect(Math.hypot(p[0] - x!, p[2] - z!)).toBeGreaterThan(2);
  }
});

test('home camera aims between the board and the fire', () => {
  const { target } = homePose(10);
  expect(target[0]).toBeLessThan(0);
  expect(target[0]).toBeGreaterThan(-26);
});

test('orbit: one turn in 40 s at radius 18 and tilt 35°', () => {
  const a = orbitPose(0);
  const b = orbitPose(40);
  expect(a.position[0]).toBeCloseTo(b.position[0], 6);
  expect(a.position[2]).toBeCloseTo(b.position[2], 6);
  const p = orbitPose(7).position;
  expect(Math.hypot(p[0], p[2])).toBeCloseTo(18 * Math.cos((35 * Math.PI) / 180), 1);
  expect(p[1] - orbitPose(7).target[1]).toBeCloseTo(18 * Math.sin((35 * Math.PI) / 180), 1);
  expect(orbitPose(10).position[0]).not.toBeCloseTo(orbitPose(0).position[0], 1);
});

test('seat arc rises in the middle and lands exactly', () => {
  const a = playCamera(0, S, B);
  const b = playCamera(1, S, B);
  expect(seatArc(a, b, 0.5).position[1]).toBeGreaterThan(a.position[1] + 4);
  expect(seatArc(a, b, 1)).toEqual(b);
  expect(seatArc(a, b, 0)).toEqual(a);
  // The arc passes the fire end (−x) rather than the hut end.
  expect(seatArc(a, b, 0.5).position[0]).toBeLessThan(0);
});

test('default bands follow the reference and compact layouts', () => {
  expect(defaultBands(390)).toEqual({ top: 56, bottom: 313 });
  expect(defaultBands(300)).toEqual({ top: 44, bottom: 244 });
  expect(defaultBands(720)).toEqual({ top: 56, bottom: 643 });
});
