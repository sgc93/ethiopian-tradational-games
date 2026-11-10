import { expect, test } from 'vitest';
import { fitPoints, type Vec3 } from '../layout';
import { defaultBands, homePose, openingPose, orbitPose, playCamera, project, seatArc, topCamera, type Bands } from './poses';

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
  // Aimed towards the near player, so the board's centre sits in the upper part of the screen, clear of the low panels.
  const [x, y] = project(pose, S, [0, 0, 0]);
  expect(x).toBeCloseTo(S.width / 2, 0);
  expect(y).toBeLessThan(S.height * 0.42);
  expect(y).toBeGreaterThan(S.height * 0.2);
});

test('with less room between the bars, the home camera stands back along the same line', () => {
  const near = homePose(5);
  const far = homePose(5, 0.5);
  expect(homePose(5, 0.71)).toEqual(near);
  // With room to spare it comes a little nearer, but only a little.
  expect(Math.hypot(...homePose(5, 1).position) / Math.hypot(...near.position)).toBeCloseTo(0.88, 5);
  // A narrow screen stands it back as well.
  expect(Math.hypot(...homePose(5, 0.71, 0.5, 4 / 3).position) / Math.hypot(...near.position)).toBeCloseTo(4 / 3, 5);
  const ratio = Math.hypot(...far.position) / Math.hypot(...near.position);
  expect(ratio).toBeCloseTo(0.71 / 0.5, 5);
  far.position.forEach((v, i) => expect(v / near.position[i]!).toBeCloseTo(ratio, 5));
  expect(far.target[1] / near.target[1]).toBeCloseTo(ratio, 5);
});

test('the home camera tips so the picture sits between unequal bars', () => {
  // A taller bottom bar puts the middle of the free space above the screen's middle: the camera aims lower, and the board rises.
  const level = homePose(5, 0.7, 0.5);
  const raised = homePose(5, 0.7, 0.46);
  expect(raised.target[1]).toBeLessThan(level.target[1]);
  expect(project(raised, S, [0, 0, 0])[1]).toBeLessThan(project(level, S, [0, 0, 0])[1]);
  expect(raised.position).toEqual(level.position);
});

test('home view: a low three-quarter, drifting ±10° about 30° left, 5.1–5.9 up, 19 from the board', () => {
  for (let t = 0; t < 60; t += 0.5) {
    const p = homePose(t);
    const az = (Math.atan2(p.position[0], p.position[2]) * 180) / Math.PI;
    expect(az).toBeLessThanOrEqual(-19.99);
    expect(az).toBeGreaterThanOrEqual(-40.01);
    expect(p.position[1]).toBeGreaterThanOrEqual(5.1);
    expect(p.position[1]).toBeLessThanOrEqual(5.9);
    expect(Math.hypot(p.position[0], p.position[2])).toBeCloseTo(19, 1);
    expect(p.position[2]).toBeGreaterThan(0); // on A's side
  }
  homePose(0).position.forEach((v, i) => expect(v).toBeCloseTo(homePose(60).position[i]!, 9)); // once a minute
});

test('the home camera shows the horizon above the board', () => {
  const pose = homePose(10);
  const horizon = project(pose, S, [pose.position[0] * -50, pose.position[1], pose.position[2] * -50])[1];
  const board = project(pose, S, [0, 0, 0])[1];
  expect(horizon).toBeGreaterThan(0);
  expect(horizon).toBeLessThan(S.height * 0.4);
  expect(board).toBeGreaterThan(horizon);
});

test('home camera aims over the board', () => {
  const { target } = homePose(10);
  expect(Math.hypot(target[0], target[2])).toBeLessThan(1);
  expect(target[1]).toBeGreaterThan(0);
  expect(target[1]).toBeLessThan(4);
});

test('the opening shot is high over the yard, on the home view\'s line', () => {
  const home = homePose(0);
  const open = openingPose(home);
  expect(open.position[1]).toBeGreaterThan(home.position[1] * 3);
  expect(Math.atan2(open.position[0], open.position[2])).toBeCloseTo(Math.atan2(home.position[0], home.position[2]), 9);
  expect(Math.hypot(open.position[0], open.position[2])).toBeGreaterThan(Math.hypot(home.position[0], home.position[2]) * 2);
});

test('result view: a swing of 35° either side of broadside every 40 s, low and wide', () => {
  for (let t = 0; t <= 40; t += 1) {
    const [x, , z] = orbitPose(t).position;
    expect(Math.abs(Math.atan2(x, z))).toBeLessThanOrEqual((35 * Math.PI) / 180 + 1e-9);
  }
  expect(Math.atan2(orbitPose(10).position[0], orbitPose(10).position[2])).toBeCloseTo((35 * Math.PI) / 180, 6);
  const a = orbitPose(0);
  const b = orbitPose(40);
  expect(a.position[0]).toBeCloseTo(b.position[0], 6);
  expect(a.position[2]).toBeCloseTo(b.position[2], 6);
  const p = orbitPose(7).position;
  expect(Math.hypot(p[0], p[2])).toBeCloseTo(22 * Math.cos((12 * Math.PI) / 180), 1);
  expect(p[1] - orbitPose(7).target[1]).toBeCloseTo(22 * Math.sin((12 * Math.PI) / 180), 1);
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
