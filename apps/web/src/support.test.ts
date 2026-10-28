import { expect, test } from 'vitest';
import { supportsWebGL2 } from './support';

test('supportsWebGL2 is false when no context is available', () => {
  const doc = { createElement: () => ({ getContext: () => null }) } as unknown as Document;
  expect(supportsWebGL2(doc)).toBe(false);
});

test('supportsWebGL2 is true when a WebGL 2 context comes back', () => {
  const doc = { createElement: () => ({ getContext: (k: string) => (k === 'webgl2' ? {} : null) }) } as unknown as Document;
  expect(supportsWebGL2(doc)).toBe(true);
});

test('supportsWebGL2 is false when asking throws', () => {
  const doc = {
    createElement: () => {
      throw new Error('blocked');
    },
  } as unknown as Document;
  expect(supportsWebGL2(doc)).toBe(false);
});
