import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { encodeHeadSet } from './sculpt/pack';
import { useBoardGeometry } from './useBoardGeometry';

const tri = { position: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), uv: new Float32Array([0, 0, 1, 0, 0, 1]), index: new Uint32Array([0, 1, 2]) };

afterEach(() => vi.unstubAllGlobals());

test('builds the body on the main thread without Worker and fetches the prebuilt heads', async () => {
  expect(typeof Worker).toBe('undefined');
  const bytes = encodeHeadSet({ head: tri, hornL: tri, hornR: tri });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => bytes })));
  const { result } = renderHook(() => useBoardGeometry('half'));
  await waitFor(() => expect(result.current).not.toBeNull(), { timeout: 15_000 });
  const g = result.current!;
  expect(g.body.groups).toHaveLength(3);
  expect(g.body.attributes.position!.count).toBeGreaterThan(100);
  expect(g.head.attributes.position!.count).toBe(3);
  expect(g.hornR.attributes.position!.count).toBe(g.hornL.attributes.position!.count);
}, 20_000);

test('a head set that cannot be fetched still gives a board, without heads', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, arrayBuffer: async () => new ArrayBuffer(0) })));
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { result } = renderHook(() => useBoardGeometry('full'));
  await waitFor(() => expect(result.current).not.toBeNull(), { timeout: 15_000 });
  expect(result.current!.body.attributes.position!.count).toBeGreaterThan(100);
  expect(result.current!.head.attributes.position).toBeUndefined();
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
}, 20_000);
