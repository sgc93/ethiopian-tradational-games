import { expect, test } from 'vitest';
import { hudShown, menuShown } from './gameChrome';

test('the menu medallion steps aside with the HUD during the toss, in a lesson and at the result', () => {
  expect(menuShown({ phase: 'awaiting-move', tossOpen: false, lesson: false })).toBe(true);
  expect(menuShown({ phase: 'awaiting-move', tossOpen: true, lesson: false })).toBe(false);
  expect(menuShown({ phase: 'awaiting-move', tossOpen: false, lesson: true })).toBe(false);
  expect(menuShown({ phase: 'finished', tossOpen: false, lesson: false })).toBe(false);
});

test('the HUD shows in play and hides during the toss, at the result and while a lesson card is open', () => {
  expect(hudShown({ phase: 'awaiting-move', tossOpen: false, card: false })).toBe(true);
  expect(hudShown({ phase: 'awaiting-move', tossOpen: true, card: false })).toBe(false);
  expect(hudShown({ phase: 'finished', tossOpen: false, card: false })).toBe(false);
  expect(hudShown({ phase: 'awaiting-move', tossOpen: false, card: true })).toBe(false);
});
