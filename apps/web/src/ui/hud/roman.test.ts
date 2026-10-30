import { expect, test } from 'vitest';
import { roman } from './roman';

test('small roman numerals for the cartouche', () => {
  expect([1, 2, 3, 4, 5, 6, 9, 10].map(roman)).toEqual(['I', 'II', 'III', 'IV', 'V', 'VI', 'IX', 'X']);
});
