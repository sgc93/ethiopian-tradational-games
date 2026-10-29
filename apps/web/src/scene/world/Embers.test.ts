import { expect, test } from 'vitest';
import { embersState } from './embersState';

test('embers live 2.5–5 s and rise to about 40', () => {
  const s = embersState(100, 1);
  expect(s.origin.length).toBe(300);
  for (let i = 0; i < 100; i++) {
    expect(s.life[i]!).toBeGreaterThanOrEqual(2.5);
    expect(s.life[i]!).toBeLessThanOrEqual(5);
    const rise = s.speed[i]! * s.life[i]!;
    expect(rise).toBeGreaterThan(20);
    expect(rise).toBeLessThan(45);
    expect(s.size[i]!).toBeGreaterThanOrEqual(2);
    expect(s.size[i]!).toBeLessThanOrEqual(4);
  }
});

test('embers start inside the flame', () => {
  const s = embersState(50, 2);
  for (let i = 0; i < 50; i++) {
    expect(Math.hypot(s.origin[i * 3]! + 26, s.origin[i * 3 + 2]! + 2)).toBeLessThan(3);
    expect(s.origin[i * 3 + 1]!).toBeGreaterThan(-1.8);
  }
});
