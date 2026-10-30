import { afterEach, expect, test, vi } from 'vitest';
import { loadHeadSet } from './headMesh';
import { encodeHeadSet } from './sculpt/pack';

const tri = { position: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), normal: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), uv: new Float32Array([0, 0, 1, 0, 0, 1]), index: new Uint32Array([0, 1, 2]) };

afterEach(() => vi.unstubAllGlobals());

test('loads and decodes the prebuilt head set for a detail level', async () => {
  const bytes = encodeHeadSet({ head: tri, hornL: tri, hornR: tri });
  const fetchMock = vi.fn(async (url: string) => ({ ok: true, arrayBuffer: async () => bytes, url }));
  vi.stubGlobal('fetch', fetchMock);
  const set = await loadHeadSet('half');
  expect(fetchMock.mock.calls[0]![0]).toBe('/models/ibex-head-half.bin');
  expect(set.head.index).toEqual(tri.index);
  expect(set.hornR.normal).toHaveLength(9);
});

test('a missing file rejects rather than returning rubbish', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) })));
  await expect(loadHeadSet('full')).rejects.toThrow(/404/);
});
