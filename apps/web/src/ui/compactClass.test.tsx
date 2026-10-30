import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { useUiMetrics } from './useUiMetrics';

afterEach(cleanup);

function viewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

test('a viewport under 340 px tall marks the root compact, a taller one clears it', () => {
  viewport(750, 300);
  const { unmount } = renderHook(() => useUiMetrics());
  expect(document.documentElement.classList.contains('ui-compact')).toBe(true);
  unmount();
  viewport(844, 390);
  renderHook(() => useUiMetrics());
  expect(document.documentElement.classList.contains('ui-compact')).toBe(false);
});
