import data from './board-dimensions.json';

/** One game unit (p) is one cup pitch. */
export const MM_PER_UNIT = 50;

export type Point2 = [number, number];

export interface HornStation {
  t: number;
  s: number;
  u: number;
  v: number;
  z: number;
  depth: number;
  width: number;
  normal: Point2;
}

/** The carved board's dimensions, in game units; a copy of `docs/design/board/blueprint/board-dimensions.json`. */
export interface Blueprint {
  units: { length: string; mmPerUnit: number; note: string };
  axes: string;
  body: {
    halfLength: number;
    halfWidth: number;
    thickness: number;
    topEdgeRadius: number;
    bottomEdgeRadius: number;
    plan: string;
    endCentreX: number;
    perimeter: number;
  };
  cups: {
    pitch: number;
    rowZ: number;
    diameter: number;
    depth: number;
    rimRadius: number;
    sphereRadius: number;
    shape: string;
    holes: { hole: number; player: 'A' | 'B'; x: number; z: number }[];
  };
  stores: {
    x: number;
    diameter: number;
    depth: number;
    rimRadius: number;
    sphereRadius: number;
    shape: string;
    list: { player: 'A' | 'B'; x: number; z: number }[];
  };
  feet: {
    x: number;
    z: number;
    size: number;
    height: number;
    chamfer: number;
    list: { x: number; z: number }[];
    note: string;
  };
  heads: {
    x: number;
    height: number;
    neckFilletRadius: number;
    list: { x: number; facing: '+x' | '-x'; end: string }[];
    axes: string;
    measures: {
      sideLength: number;
      hornBack: number;
      muzzle: number;
      earTipV: number;
      skullTopV: number;
      neckFoot: Point2;
      neckFlare: Point2;
      neckFootWidth: number;
      hornSpread: number;
      hornTipSpacing: number;
      topLength: number;
    };
    outlines: {
      /** (u, v), the whole head with horns. */
      side: Point2[];
      sideHeadOnly: Point2[];
      /** (w, v) */
      frontHeadOnly: Point2[];
      /** (u, w) */
      topHeadOnly: Point2[];
      frontSilhouette: Point2[][];
      topSilhouette: Point2[][];
      note: string;
    };
    horn: {
      length: number;
      stations: HornStation[];
      ridges: { count: number; list: { t: number; height: number }[] };
      note: string;
    };
  };
  band: {
    height: number;
    centreY: number;
    relief: number;
    repeats: number;
    repeat: number;
    bottomY: number;
    rows: Record<string, number>;
    zigzag: { thickness: number; rise: number; slopeDeg: number };
    pyramid: { steps: number; stepHeight: number; topWidth: number; stepInset: number; baseWidth: number };
    triangle: { base: number; height: number };
    motif: { raised: Point2[][]; cut: Point2[][]; note: string };
    start: string;
  };
  stones: { diameter: number };
  gameLayoutChanges: Record<string, { now: number; blueprint: number; note?: string }>;
}

export const BLUEPRINT = data as unknown as Blueprint;
