import type { Detail } from './bodyGeometry';
import type { GeometryData } from './headGeometry';
import { decodeHeadSet, type HeadSet } from './sculpt/pack';

/**
 * The prebuilt Walia ibex head set (one head and both horns, head-local), made offline by
 * `scripts/build-heads.ts` from the sculpt in `sculpt/` and shipped in `public/models`.
 */
export async function loadHeadSet(detail: Detail): Promise<HeadSet<GeometryData>> {
  const url = `/models/ibex-head-${detail}.bin`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`head set ${url}: ${res.status}`);
  return decodeHeadSet(await res.arrayBuffer());
}
