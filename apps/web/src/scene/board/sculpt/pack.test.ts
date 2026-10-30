import { expect, test } from 'vitest';
import { decodeHeadSet, encodeHeadSet, type PackedMesh } from './pack';

function mesh(seed: number, verts: number, tris: number): PackedMesh {
  const position = new Float32Array(verts * 3);
  const uv = new Float32Array(verts * 2);
  for (let i = 0; i < position.length; i++) position[i] = Math.sin(seed + i) * 2;
  for (let i = 0; i < uv.length; i++) uv[i] = (Math.cos(seed * 3 + i) + 1) / 2;
  const index = new Uint32Array(tris * 3);
  for (let i = 0; i < index.length; i++) index[i] = (i * 7 + seed) % verts;
  return { position, uv, index };
}

test('a head set survives encoding and decoding to within a tenth of a millimetre', () => {
  const set = { head: mesh(1, 500, 900), hornL: mesh(2, 300, 500), hornR: mesh(3, 300, 500) };
  const bytes = encodeHeadSet(set);
  expect(bytes.byteLength).toBeLessThan(500 * 10 + 900 * 6 + 2 * (300 * 10 + 500 * 6) + 200);
  const back = decodeHeadSet(bytes);
  for (const part of ['head', 'hornL', 'hornR'] as const) {
    expect(back[part].index).toEqual(set[part].index);
    expect(back[part].position.length).toBe(set[part].position.length);
    for (let i = 0; i < set[part].position.length; i++) expect(Math.abs(back[part].position[i]! - set[part].position[i]!)).toBeLessThan(0.002);
    for (let i = 0; i < set[part].uv.length; i++) expect(Math.abs(back[part].uv[i]! - set[part].uv[i]!)).toBeLessThan(0.001);
    expect(back[part].normal.length).toBe(set[part].position.length);
  }
});

test('decoding refuses bytes that are not a head set', () => {
  expect(() => decodeHeadSet(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer)).toThrow(/head set/);
});
