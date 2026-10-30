import { expect, test } from 'vitest';
import { nudge, pressScale, ringPulse, suggestedPulse, turnSwell } from './pulses';

test('ring pulse stays within 0.4–1.0 with a 1.6 s period', () => {
  for (let t = 0; t < 4; t += 0.01) {
    const v = ringPulse(t);
    expect(v).toBeGreaterThanOrEqual(0.4);
    expect(v).toBeLessThanOrEqual(1);
  }
  expect(ringPulse(0)).toBeCloseTo(ringPulse(1.6));
  expect(ringPulse(0.4)).toBeCloseTo(1);
  expect(ringPulse(1.2)).toBeCloseTo(0.4);
});

test('the suggested cup pulses faster and brighter: 0.6–1.0 every second', () => {
  for (let t = 0; t < 3; t += 0.01) {
    const v = suggestedPulse(t);
    expect(v).toBeGreaterThanOrEqual(0.6);
    expect(v).toBeLessThanOrEqual(1);
  }
  expect(suggestedPulse(0)).toBeCloseTo(suggestedPulse(1));
  expect(suggestedPulse(0.25)).toBeCloseTo(1);
});

test('a press tightens the ring by 4%', () => {
  expect(pressScale).toBe(0.96);
});

test('turn swell peaks near 10% and ends at 1', () => {
  expect(turnSwell(0.4)).toBeCloseTo(1.1, 2);
  expect(turnSwell(0.8)).toBeCloseTo(1);
  expect(turnSwell(2)).toBe(1);
  expect(turnSwell(-1)).toBe(1);
});

test('the capture nudge is 3% at its peak and nothing after half a second', () => {
  expect(nudge(0.25)).toBeCloseTo(0.03, 3);
  expect(nudge(0.5)).toBeCloseTo(0);
  expect(nudge(1)).toBe(0);
});
