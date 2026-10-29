import type { Blueprint } from './blueprint';
import { buildBoardBody, type Detail } from './bodyGeometry';
import { buildHead, fromBufferGeometry, type GeometryData } from './headGeometry';
import { buildHorn } from './hornGeometry';

export interface BoardSetRequest {
  detail: Detail;
}

/** Everything the board needs, as transferable arrays; the body keeps its three material groups. */
export interface BoardSetData {
  detail: Detail;
  parts: { body: GeometryData; head: GeometryData; hornL: GeometryData; hornR: GeometryData };
  bodyGroups: { start: number; count: number; materialIndex: number }[];
}

/** Builds the body, one head and both horns (head-local; the caller places them at each end). */
export function buildBoardSet(bp: Blueprint, detail: Detail): BoardSetData {
  const body = buildBoardBody(bp, detail);
  const headBudget = detail === 'full' ? 8000 : 4000;
  const hornBudget = detail === 'full' ? 6000 : 3000;
  return {
    detail,
    parts: {
      body: fromBufferGeometry(body),
      head: buildHead(bp, headBudget),
      hornL: buildHorn(bp, 1, hornBudget),
      hornR: buildHorn(bp, -1, hornBudget),
    },
    bodyGroups: body.groups.map((g) => ({ start: g.start, count: g.count, materialIndex: g.materialIndex ?? 0 })),
  };
}
