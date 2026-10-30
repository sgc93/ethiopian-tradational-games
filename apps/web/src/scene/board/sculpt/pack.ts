import * as THREE from 'three';
import type { GeometryData } from '../headGeometry';

/** A mesh ready to pack: positions, uvs and triangle indices. */
export interface PackedMesh {
  position: Float32Array;
  uv: Float32Array;
  index: Uint32Array;
}

export interface HeadSet<T> {
  head: T;
  hornL: T;
  hornR: T;
}

const MAGIC = 0x31584249; // "IBX1"
const PARTS = ['head', 'hornL', 'hornR'] as const;

/**
 * The prebuilt head set as one small binary: a magic word, then for each part its counts, its
 * bounds, positions as 16-bit fractions of the bounds, uvs as 16-bit fractions, and 16- or 32-bit
 * indices. Normals are recomputed when decoded.
 */
export function encodeHeadSet(set: HeadSet<PackedMesh>): ArrayBuffer {
  const chunks: ArrayBuffer[] = [new Uint32Array([MAGIC]).buffer];
  for (const part of PARTS) {
    const m = set[part];
    const verts = m.position.length / 3;
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < verts; i++) {
      for (let k = 0; k < 3; k++) {
        const x = m.position[i * 3 + k]!;
        min[k] = Math.min(min[k]!, x);
        max[k] = Math.max(max[k]!, x);
      }
    }
    const wide = verts > 65535;
    const header = new ArrayBuffer(8 + 24);
    const dv = new DataView(header);
    dv.setUint32(0, verts, true);
    dv.setUint32(4, (m.index.length << 1) | (wide ? 1 : 0), true);
    for (let k = 0; k < 3; k++) {
      dv.setFloat32(8 + k * 4, min[k]!, true);
      dv.setFloat32(20 + k * 4, max[k]! - min[k]! || 1, true);
    }
    const pos = new Uint16Array(verts * 3);
    for (let i = 0; i < verts; i++) {
      for (let k = 0; k < 3; k++) {
        const span = max[k]! - min[k]! || 1;
        pos[i * 3 + k] = Math.round(((m.position[i * 3 + k]! - min[k]!) / span) * 65535);
      }
    }
    const uv = new Uint16Array(verts * 2);
    for (let i = 0; i < uv.length; i++) uv[i] = Math.round(Math.min(1, Math.max(0, m.uv[i]!)) * 65535);
    const index = wide ? new Uint32Array(m.index) : new Uint16Array(m.index);
    // Each array padded to a 4-byte boundary.
    chunks.push(header, pad(pos.buffer), pad(uv.buffer), pad(index.buffer));
  }
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(new Uint8Array(c), at);
    at += c.byteLength;
  }
  return out.buffer;
}

function pad(buffer: ArrayBufferLike): ArrayBuffer {
  const rem = buffer.byteLength % 4;
  if (rem === 0) return buffer as ArrayBuffer;
  const out = new Uint8Array(buffer.byteLength + 4 - rem);
  out.set(new Uint8Array(buffer));
  return out.buffer;
}

/** Reads a head set back into geometry data with normals. Throws on anything that is not one. */
export function decodeHeadSet(buffer: ArrayBuffer): HeadSet<GeometryData> {
  const dv = new DataView(buffer);
  if (buffer.byteLength < 4 || dv.getUint32(0, true) !== MAGIC) throw new Error('not a head set');
  let at = 4;
  const out: Partial<HeadSet<GeometryData>> = {};
  for (const part of PARTS) {
    const verts = dv.getUint32(at, true);
    const packedIndex = dv.getUint32(at + 4, true);
    const indexCount = packedIndex >>> 1;
    const wide = (packedIndex & 1) === 1;
    const min = [0, 1, 2].map((k) => dv.getFloat32(at + 8 + k * 4, true));
    const span = [0, 1, 2].map((k) => dv.getFloat32(at + 20 + k * 4, true));
    at += 32;
    const pos = new Uint16Array(buffer, at, verts * 3);
    at += align(verts * 3 * 2);
    const uvq = new Uint16Array(buffer, at, verts * 2);
    at += align(verts * 2 * 2);
    const index = wide ? new Uint32Array(new Uint32Array(buffer, at, indexCount)) : new Uint32Array(new Uint16Array(buffer, at, indexCount));
    at += align(indexCount * (wide ? 4 : 2));
    const position = new Float32Array(verts * 3);
    for (let i = 0; i < verts; i++) for (let k = 0; k < 3; k++) position[i * 3 + k] = min[k]! + (pos[i * 3 + k]! / 65535) * span[k]!;
    const uv = new Float32Array(verts * 2);
    for (let i = 0; i < uv.length; i++) uv[i] = uvq[i]! / 65535;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(position, 3));
    g.setIndex(new THREE.BufferAttribute(index, 1));
    g.computeVertexNormals();
    out[part] = { position, normal: new Float32Array(g.getAttribute('normal').array), uv, index };
  }
  return out as HeadSet<GeometryData>;
}

const align = (n: number) => n + ((4 - (n % 4)) % 4);
