import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useScene } from '../scene/sceneStore';
import { useUiMetrics } from './useUiMetrics';

afterEach(() => {
  vi.unstubAllGlobals();
  useScene.setState({ bands: null });
});

test('visualViewport resize updates the scale, the root variable and the scene bands', () => {
  const listeners: (() => void)[] = [];
  const vv = { width: 844, height: 390, addEventListener: (_: string, fn: () => void) => listeners.push(fn), removeEventListener: () => {} };
  vi.stubGlobal('visualViewport', vv);
  const { result } = renderHook(() => useUiMetrics());
  expect(result.current.scale).toBe(1);
  expect(document.documentElement.style.getPropertyValue('--ui')).toBe('1');
  expect(useScene.getState().bands).toEqual({ top: 56, bottom: 313 });
  act(() => {
    vv.height = 300;
    vv.width = 750;
    listeners.forEach((fn) => fn());
  });
  expect(result.current.compact).toBe(true);
  expect(document.documentElement.style.getPropertyValue('--ui')).toBe('0.82');
  expect(useScene.getState().bands!.top).toBeCloseTo(36.08, 1);
});
