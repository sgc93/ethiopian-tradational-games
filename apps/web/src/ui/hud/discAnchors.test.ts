import { expect, test } from 'vitest';
import { playCamera } from '../../scene/camera/poses';
import { discAnchor, discScreen } from './discAnchors';

const S = { width: 844, height: 390 };

test('disc anchors match the mockup at 844×390', () => {
  const pose = playCamera(0, S, { top: 56, bottom: 313 });
  const expected = [
    [306.6, 247.7], [352.7, 247.7], [398.9, 247.7], [445.1, 247.7], [491.3, 247.7], [537.4, 247.7],
    [527, 169.6], [485, 169.6], [443, 169.6], [401, 169.6], [359, 169.6], [317, 169.6],
    [584, 192.1], [260, 192.1],
  ];
  // The fitted play camera reproduces the design tool's within half a unit of distance: 3 px here.
  expected.forEach(([x, y], i) => {
    const [px, py] = discScreen(pose, S, i, 0);
    expect(Math.abs(px - x!), `disc ${i} x`).toBeLessThan(3);
    expect(Math.abs(py - y!), `disc ${i} y`).toBeLessThan(3);
  });
});

test('seat B keeps the cups’ anchors (outside the near row, beyond the far one is symmetric) and mirrors the stores’', () => {
  expect(discAnchor(0, 1)).toEqual(discAnchor(0, 0));
  expect(discAnchor(7, 1)).toEqual(discAnchor(7, 0));
  expect(discAnchor(12, 1)[2]).toBeCloseTo(-discAnchor(12, 0)[2]);
  expect(discAnchor(13, 1)[2]).toBeCloseTo(-discAnchor(13, 0)[2]);
  expect(discAnchor(12, 1)[0]).toBeCloseTo(discAnchor(12, 0)[0]);
});
