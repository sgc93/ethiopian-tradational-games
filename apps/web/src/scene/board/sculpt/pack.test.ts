import { expect, test } from 'vitest';
import { decodeHeadSet, encodeHeadSet, type PackedMesh } from './pack';

function mesh(seed: number, verts: number, tris: number): PackedMesh {
  const position = new Float32Array(verts * 3);
  const uv = new Float32Array(verts * 2);
  for (let i = 0; i < position.length; i++) position[i] = Math.sin(seed + i) * 2;
  for (let i = 0; i < uv.length; i++) uv[i] = (Math.cos(seed * 3 + i) + 1) / 2;
  const normal = new Float32Array(verts * 3);
  for (let i = 0; i < verts; i++) {
    const [x, y, z] = [Math.sin(seed + i), Math.cos(seed * 2 + i), Math.sin(seed * 5 + i * 3)];
    const l = Math.hypot(x, y, z);
    normal.set([x / l, y / l, z / l], i * 3);
  }
  const index = new Uint32Array(tris * 3);
  for (let i = 0; i < index.length; i++) index[i] = (i * 7 + seed) % verts;
  return { position, normal, uv, index };
}

test('a head set survives encoding and decoding: positions to a tenth of a millimetre, normals to a degree or so', () => {
  const set = { head: mesh(1, 500, 900), hornL: mesh(2, 300, 500), hornR: mesh(3, 300, 500) };
  const bytes = encodeHeadSet(set);
  expect(bytes.byteLength).toBeLessThan(500 * 13 + 900 * 6 + 2 * (300 * 13 + 500 * 6) + 200);
  const back = decodeHeadSet(bytes);
  for (const part of ['head', 'hornL', 'hornR'] as const) {
    expect(back[part].index).toEqual(set[part].index);
    expect(back[part].position.length).toBe(set[part].position.length);
    for (let i = 0; i < set[part].position.length; i++) expect(Math.abs(back[part].position[i]! - set[part].position[i]!)).toBeLessThan(0.002);
    for (let i = 0; i < set[part].uv.length; i++) expect(Math.abs(back[part].uv[i]! - set[part].uv[i]!)).toBeLessThan(0.001);
    for (let i = 0; i < set[part].normal.length; i++) expect(Math.abs(back[part].normal[i]! - set[part].normal[i]!)).toBeLessThan(0.02);
  }
});

test('decoding refuses bytes that are not a head set', () => {
  expect(() => decodeHeadSet(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer)).toThrow(/head set/);
});
