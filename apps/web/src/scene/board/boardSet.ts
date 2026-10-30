import type { Blueprint } from './blueprint';
import { buildBoardBody, type Detail } from './bodyGeometry';
import { fromBufferGeometry, type GeometryData } from './headGeometry';

export interface BoardSetRequest {
  detail: Detail;
}

/** The board's body as transferable arrays, with its three material groups. The heads are prebuilt (`headMesh.ts`). */
export interface BoardSetData {
  detail: Detail;
  parts: { body: GeometryData };
  bodyGroups: { start: number; count: number; materialIndex: number }[];
}

/** Builds the body for a detail level. */
export function buildBoardSet(bp: Blueprint, detail: Detail): BoardSetData {
  const body = buildBoardBody(bp, detail);
  return {
    detail,
    parts: { body: fromBufferGeometry(body) },
    bodyGroups: body.groups.map((g) => ({ start: g.start, count: g.count, materialIndex: g.materialIndex ?? 0 })),
  };
}
