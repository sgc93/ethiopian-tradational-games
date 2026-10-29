import { renderHook, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { useBoardGeometry } from './useBoardGeometry';

test('falls back to the main thread without Worker', async () => {
  expect(typeof Worker).toBe('undefined');
  const { result } = renderHook(() => useBoardGeometry('half'));
  await waitFor(() => expect(result.current).not.toBeNull(), { timeout: 15_000 });
  const g = result.current!;
  expect(g.head.attributes.position!.count).toBeGreaterThan(100);
  expect(g.body.groups).toHaveLength(3);
  expect(g.hornL.attributes.position!.count).toBeGreaterThan(100);
  expect(g.hornR.attributes.position!.count).toBe(g.hornL.attributes.position!.count);
}, 20_000);
