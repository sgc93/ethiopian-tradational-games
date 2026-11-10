import { expect, test } from 'vitest';
import { BOARD_FOCUS, FOCUS_RANGE, focusBlur, postEffects, shadowRadius } from './postPlan';
import type { PostLevel } from './tiers';

const COMPOSED: PostLevel[] = ['full', 'full-no-dof', 'light'];

test('every tier with a composer maps tones itself, since the composer turns the renderer’s mapping off', () => {
  for (const level of COMPOSED) expect(postEffects(level)).toContain('tone-mapping');
  // The minimal tier has no composer: the renderer's own tone mapping stands.
  expect(postEffects('none')).toEqual([]);
});

test('tones are mapped after the light-gathering effects and before the film ones', () => {
  for (const level of COMPOSED) {
    const order = postEffects(level);
    const at = (name: (typeof order)[number]) => order.indexOf(name);
    expect(at('bloom')).toBeLessThan(at('tone-mapping'));
    if (order.includes('depth-of-field')) expect(at('depth-of-field')).toBeLessThan(at('tone-mapping'));
    for (const film of ['grain', 'vignette', 'grade'] as const) expect(at('tone-mapping')).toBeLessThan(at(film));
  }
});

test('depth of field and SMAA are the high tier’s alone', () => {
  expect(postEffects('full')).toEqual(['smaa', 'bloom', 'depth-of-field', 'tone-mapping', 'grain', 'vignette', 'grade']);
  expect(postEffects('full-no-dof')).toEqual(['bloom', 'tone-mapping', 'grain', 'vignette', 'grade']);
  expect(postEffects('light')).toEqual(['bloom', 'tone-mapping', 'grain', 'vignette', 'grade']);
});

test('the focus is on the board: the board stays sharp, the hut and the trees soften', () => {
  expect(BOARD_FOCUS).toEqual([0, 0.4, 0]); // the play camera's target
  // Every cup lies within 4 units of the focus distance from any play camera, the heads within 7.
  expect(focusBlur(4)).toBeLessThan(0.06);
  expect(focusBlur(7)).toBeLessThan(0.15);
  // The hut (150 units off) and the trees (400 and more) are fully soft.
  expect(focusBlur(150)).toBe(1);
  expect(focusBlur(FOCUS_RANGE)).toBe(1);
  expect(focusBlur(0)).toBe(0);
});

test('a shadow’s edge is as soft on the small shadow map as on the large one', () => {
  expect(shadowRadius(1024)).toBe(2.5);
  expect(shadowRadius(512)).toBe(1.25);
  expect(shadowRadius(0)).toBe(0);
});
