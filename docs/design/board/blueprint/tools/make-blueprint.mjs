// Draws the Gebeta board blueprint from the measured dimensions and the traced ibex outlines.
// Usage: node make-blueprint.mjs
// Reads ../ibex-outlines.json (from trace-outline.mjs) and writes next to it: board.svg, ibex-head.svg,
// band.svg, band-height-tile.svg and board-dimensions.json. Every length is in game units (p):
// 1 p = one cup pitch = 1 unit in apps/web/src/scene/layout.ts = 50 mm on the real board.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { traceMask } from './trace-outline.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..');
const traced = JSON.parse(readFileSync(join(OUT, 'ibex-outlines.json'), 'utf8'));
const MM = 50;

// ---------- board dimensions (see ../README.md for where each one comes from) ----------
// Axes: +x towards player A's store (A's right), +y up, +z towards player A. Origin at the centre of the top face.
const body = { halfLength: 6.05, halfWidth: 1.28, thickness: 1.25, topEdgeRadius: 0.15, bottomEdgeRadius: 0.1 };
const endX = body.halfLength - body.halfWidth; // centre of each rounded end
const perimeter = 4 * endX + 2 * Math.PI * body.halfWidth;
const cup = { pitch: 1, rowZ: 0.575, diameter: 0.88, depth: 0.36, rimRadius: 0.03 };
const store = { x: 3.75, diameter: 1.4, depth: 0.45, rimRadius: 0.03 };
const foot = { x: 4.9, z: 0.7, size: 0.85, height: 0.55, chamfer: 0.06 };
const head = { x: 5.25, height: 3.2, neckFilletRadius: 0.15 };
const band = { height: 0.9, centreY: -body.thickness / 2, relief: 0.03, repeats: 32 };
band.repeat = perimeter / band.repeats;
band.bottomY = band.centreY - band.height / 2;
const stone = { diameter: 0.2 };
const capRadius = (diameter, depth) => ((diameter / 2) ** 2 + depth ** 2) / (2 * depth);
cup.sphereRadius = capRadius(cup.diameter, cup.depth);
store.sphereRadius = capRadius(store.diameter, store.depth);

// Hole numbers match the game: 0-5 are player A's row (left to right), 6-11 player B's (right to left).
const cups = Array.from({ length: 12 }, (_, i) => (i < 6
  ? { hole: i, player: 'A', x: -2.5 + i, z: cup.rowZ }
  : { hole: i, player: 'B', x: 2.5 - (i - 6), z: -cup.rowZ }));
const stores = [{ player: 'A', x: store.x, z: 0 }, { player: 'B', x: -store.x, z: 0 }];
const feet = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => ({ x: sx * foot.x, z: sz * foot.z })));

// ---------- the ibex head, from the traced silhouettes ----------
// Head-local axes: u forward (towards the muzzle), v up from the board's top face, w sideways.
// The side view (13) is the master for heights and lengths, the front view (14) only gives widths,
// and the top view (09) is fitted to both. The horns are rebuilt from the side view's centre line.
const NECK_HALF = 0.3; // half the neck's narrowest width, from the end view (04)
const EAR_HALF = 0.55; // half the ear span, from 04
const HORN = {
  arcCentrePx: [369, 439], // centre of the horn's arc in the side mask, picked by eye
  rootZ: 0.19, // the two horn roots almost touch on top of the skull (14)
  tipZ: 1.02, // outer horn spread about 2.2 p, as in the end view 04 (02 and 09 are narrower, 14 twice as wide)
  widthToDepth: 0.72,
  maxWidth: 0.34,
  minWidth: 0.04,
};

const bbox = (pts) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};

// x positions where a closed outline crosses the horizontal line at y.
function crossings(pts, y) {
  const xs = [];
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    if ((ay - y) * (by - y) < 0) xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
  }
  return xs.sort((a, b) => a - b);
}

const sidePx = traced.side.contours[0];
const sb = bbox(sidePx);
const sScale = head.height / (sb.y1 - sb.y0);
const nearBase = crossings(sidePx, sb.y1 - 0.02 * (sb.y1 - sb.y0));
const neckAxisPx = (nearBase[0] + nearBase.at(-1)) / 2;
const toSide = ([x, y]) => [(x - neckAxisPx) * sScale, (sb.y1 - y) * sScale];
const sideOutline = sidePx.map(toSide);
const sideHeadOutline = traced['side-head'].contours[0].map(toSide);
const sideEar = sideHeadOutline.reduce((a, p) => (p[1] > a[1] ? p : a));
const sideMuzzle = sideHeadOutline.reduce((a, p) => (p[0] > a[0] ? p : a));

const frontPx = traced['front-head'].contours[0];
const fb = bbox(frontPx);
const fv = sideEar[1] / (fb.y1 - fb.y0); // the ear tips meet the side view's ear tip
let narrow = null;
for (let f = 0.03; f <= 0.6; f += 0.01) {
  const xs = crossings(frontPx, fb.y1 - f * (fb.y1 - fb.y0));
  const width = xs.at(-1) - xs[0];
  if (!narrow || width < narrow.width) narrow = { width, cx: (xs[0] + xs.at(-1)) / 2 };
}
const neckHalfPx = narrow.width / 2;
const earHalfPx = Math.max(...frontPx.map(([x]) => Math.abs(x - narrow.cx)));
// 14 draws the head too wide; this squeezes it so the neck and ear span match 04.
const lateral = (dx) => {
  const a = Math.abs(dx);
  const w = a <= neckHalfPx
    ? (a * NECK_HALF) / neckHalfPx
    : NECK_HALF + ((a - neckHalfPx) * (EAR_HALF - NECK_HALF)) / (earHalfPx - neckHalfPx);
  return Math.sign(dx) * w;
};
const frontHeadOutline = frontPx.map(([x, y]) => [lateral(x - narrow.cx), (fb.y1 - y) * fv]);

const topPx = traced['top-head'].contours[0];
const tb = bbox(topPx);
const earL = topPx.reduce((a, p) => (p[0] < a[0] ? p : a));
const earR = topPx.reduce((a, p) => (p[0] > a[0] ? p : a));
const topEarY = (earL[1] + earR[1]) / 2;
const tu = (sideMuzzle[0] - sideEar[0]) / (tb.y1 - topEarY); // ear tips and muzzle line up with the side view
const tw = (2 * EAR_HALF) / (earR[0] - earL[0]);
const topCx = (earL[0] + earR[0]) / 2;
const topHeadOutline = topPx.map(([x, y]) => [sideEar[0] + (y - topEarY) * tu, (x - topCx) * tw]);

// Horn centre line: rays from the arc's centre; on each ray the outermost black run is the horn.
function rayHits(pts, [cx, cy], th) {
  const dx = Math.cos(th);
  const dy = -Math.sin(th);
  const hits = [];
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    const ex = bx - ax;
    const ey = by - ay;
    const qx = ax - cx;
    const qy = ay - cy;
    const det = -dx * ey + dy * ex;
    if (Math.abs(det) < 1e-12) continue;
    const r = (-qx * ey + qy * ex) / det;
    const s = (dx * qy - dy * qx) / det;
    if (r > 0 && s >= 0 && s < 1) hits.push(r);
  }
  return hits.sort((a, b) => a - b);
}

const rays = [];
for (let deg = 20; deg <= 270; deg += 0.5) {
  const th = (deg * Math.PI) / 180;
  const hits = rayHits(sidePx, HORN.arcCentrePx, th);
  // Near the tip the silhouette splits into two prongs; treat them as one horn.
  const inner = deg > 200 && hits.length >= 4 ? hits.at(-4) : hits.at(-2);
  const ok = hits.length >= 2 && inner > 160 && hits.at(-1) - inner < 170;
  const mid = ok ? (inner + hits.at(-1)) / 2 : 0;
  if (ok && (!rays.length || Math.abs(mid - rays.at(-1).mid) < 25)) rays.push({ deg, th, rIn: inner, rOut: hits.at(-1), mid });
  else if (rays.length) break;
}
const movingAverage = (a, k) => a.map((_, i) => {
  let s = 0;
  let n = 0;
  for (let j = Math.max(0, i - k); j <= Math.min(a.length - 1, i + k); j++) [s, n] = [s + a[j], n + 1];
  return s / n;
});
// Ridges are the bumps on the outer edge above its running mean. They shrink towards the tip,
// so every local high counts; the root (where the edge turns into the forehead) and the prongs do not.
const rOutSmooth = movingAverage(rays.map((r) => r.rOut), 10);
const ridgeResidual = rays.map((r, i) => r.rOut - rOutSmooth[i]);
const ridgeIdx = [];
ridgeResidual.forEach((v, i) => {
  if (rays[i].deg < 35 || rays[i].deg > 232 || v < 0.3) return;
  for (let j = Math.max(0, i - 4); j <= Math.min(ridgeResidual.length - 1, i + 4); j++) if (ridgeResidual[j] > v) return;
  if (!ridgeIdx.length || i - ridgeIdx.at(-1) > 8) ridgeIdx.push(i);
});
const ripple = movingAverage(ridgeResidual.map(Math.abs), 10); // mean |bump|, about 2/pi of half the bump height
const rBody = rOutSmooth.map((r, i) => r - (Math.PI / 2) * ripple[i]); // horn surface between the ridges

const hornPts = rays.map((r, i) => {
  const m = (r.rIn + rBody[i]) / 2;
  return toSide([HORN.arcCentrePx[0] + m * Math.cos(r.th), HORN.arcCentrePx[1] - m * Math.sin(r.th)]);
});
const hornDepth = rays.map((r, i) => (rBody[i] - r.rIn) * sScale);
const hornArc = [0];
for (let i = 1; i < hornPts.length; i++) {
  hornArc.push(hornArc[i - 1] + Math.hypot(hornPts[i][0] - hornPts[i - 1][0], hornPts[i][1] - hornPts[i - 1][1]));
}
const hornLength = hornArc.at(-1);
const outerArc = [0]; // along the ridged outer edge, where the ridges are spaced
for (let i = 1; i < rays.length; i++) outerArc.push(outerArc[i - 1] + rays[i].rOut * (rays[i].th - rays[i - 1].th) * sScale);

const hornZ = (t) => HORN.rootZ + (HORN.tipZ - HORN.rootZ) * Math.sin((Math.PI / 2) * Math.min(t / 0.8, 1))
  - 0.04 * Math.max(0, (t - 0.8) / 0.2) ** 2;
const hornW = (d) => Math.min(HORN.maxWidth, Math.max(HORN.minWidth, HORN.widthToDepth * d));
// Horn state at arc length s: centre (u, v), side-view depth, outward normal angle and the designed sideways part.
function hornAt(s) {
  let i = 0;
  while (i < hornArc.length - 2 && hornArc[i + 1] < s) i++;
  const f = Math.min(1, Math.max(0, (s - hornArc[i]) / (hornArc[i + 1] - hornArc[i] || 1)));
  const lerp = (a, b) => a + (b - a) * f;
  const t = s / hornLength;
  const depth = lerp(hornDepth[i], hornDepth[i + 1]);
  return {
    t,
    s,
    u: lerp(hornPts[i][0], hornPts[i + 1][0]),
    v: lerp(hornPts[i][1], hornPts[i + 1][1]),
    th: lerp(rays[i].th, rays[i + 1].th),
    depth,
    z: hornZ(t),
    width: hornW(depth),
  };
}
const hornStations = Array.from({ length: 41 }, (_, k) => hornAt((k / 40) * hornLength));
const ridges = ridgeIdx.map((i) => ({ t: hornArc[i] / hornLength, outer: outerArc[i], height: Math.PI * ripple[i] * sScale }));

// Front and top silhouettes: rasterise head + both horn sweeps, then trace the union.
function makeGrid(x0, x1, y0, y1, h) {
  const w = Math.ceil((x1 - x0) / h);
  const rows = Math.ceil((y1 - y0) / h);
  return { x0, y0, h, w, rows, cells: new Uint8Array(w * rows) };
}
function fillPolygon(g, poly) {
  for (let j = 0; j < g.rows; j++) {
    const xs = crossings(poly, g.y0 + (j + 0.5) * g.h);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const i0 = Math.max(0, Math.ceil((xs[k] - g.x0) / g.h - 0.5));
      const i1 = Math.min(g.w - 1, Math.floor((xs[k + 1] - g.x0) / g.h - 0.5));
      for (let i = i0; i <= i1; i++) g.cells[j * g.w + i] = 1;
    }
  }
}
function fillEllipse(g, cx, cy, a, b) {
  a = Math.max(a, g.h * 0.75);
  b = Math.max(b, g.h * 0.75);
  const i0 = Math.max(0, Math.floor((cx - a - g.x0) / g.h));
  const i1 = Math.min(g.w - 1, Math.ceil((cx + a - g.x0) / g.h));
  const j0 = Math.max(0, Math.floor((cy - b - g.y0) / g.h));
  const j1 = Math.min(g.rows - 1, Math.ceil((cy + b - g.y0) / g.h));
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const x = (g.x0 + (i + 0.5) * g.h - cx) / a;
      const y = (g.y0 + (j + 0.5) * g.h - cy) / b;
      if (x * x + y * y <= 1) g.cells[j * g.w + i] = 1;
    }
  }
}
const traceGrid = (g) => traceMask({ w: g.w, h: g.rows, at: (x, y) => g.cells[y * g.w + x] === 1 }, { minArea: 40, tol: 0.8 })
  .map((loop) => loop.map(([x, y]) => [g.x0 + (x + 0.5) * g.h, g.y0 + (y + 0.5) * g.h]));
const sweep = Array.from({ length: 1201 }, (_, k) => hornAt((k / 1200) * hornLength));

const frontGrid = makeGrid(-1.45, 1.45, -0.05, 3.35, 0.005);
fillPolygon(frontGrid, frontHeadOutline);
for (const h of sweep) {
  for (const side of [-1, 1]) fillEllipse(frontGrid, side * h.z, h.v, h.width / 2, (h.depth / 2) * Math.abs(Math.sin(h.th)));
}
const frontSilhouette = traceGrid(frontGrid);

// In 09 the horns hide the neck, so 09 is cut off behind the ears. Behind that cut the top view is
// filled in with the neck's sections: at each height an oval as long as the side view's neck there
// and as wide as the front view's.
const topCut = Math.min(...topHeadOutline.map(([u]) => u));
const topHeadGrid = makeGrid(-1.9, 1.9, -1.45, 1.45, 0.005);
fillPolygon(topHeadGrid, topHeadOutline);
for (let v = 0.005; v < sideEar[1]; v += topHeadGrid.h) {
  const g = topHeadGrid;
  const us = crossings(sideHeadOutline, v); // the first pair is the neck (the beard and ears come after it)
  const ws = crossings(frontHeadOutline, v);
  const mid = ws.findIndex((w, k) => k % 2 === 0 && w <= 0 && ws[k + 1] >= 0);
  if (us.length < 2 || mid < 0) continue;
  const cu = (us[0] + us[1]) / 2;
  const a = (us[1] - us[0]) / 2;
  const b = Math.max(-ws[mid], ws[mid + 1]);
  for (let i = 0; i < g.w; i++) {
    const u = g.x0 + (i + 0.5) * g.h;
    if (u > topCut + 0.02 || Math.abs(u - cu) > a) continue;
    const half = b * Math.sqrt(1 - ((u - cu) / a) ** 2);
    const j0 = Math.max(0, Math.ceil((-half - g.y0) / g.h - 0.5));
    const j1 = Math.min(g.rows - 1, Math.floor((half - g.y0) / g.h - 0.5));
    for (let j = j0; j <= j1; j++) g.cells[j * g.w + i] = 1;
  }
}
const topHeadOnly = traceGrid(topHeadGrid)[0];
const topGrid = { ...topHeadGrid, cells: topHeadGrid.cells.slice() };
for (const h of sweep) {
  for (const side of [-1, 1]) fillEllipse(topGrid, h.u, side * h.z, (h.depth / 2) * Math.abs(Math.cos(h.th)), h.width / 2);
}
const topSilhouette = traceGrid(topGrid);

// Measurements quoted on the sheets.
const sideBox = bbox(sideOutline);
const frontBox = bbox(frontSilhouette[0]);
const topBox = bbox(topSilhouette[0]);
const footAt = (v) => { const xs = crossings(sideHeadOutline, v); return [xs[0], xs.at(-1)]; };
const neckFoot = footAt(0.01);
const neckFlare = [0.02, 0.04, 0.06, 0.08, 0.1].map(footAt).reduce((a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])]);
const frontFootXs = crossings(frontHeadOutline, 0.01);
const skullTopV = (sb.y1 - (395 / 1024) * traced.side.h) * sScale; // the cut line of side-head (trace-outline.mjs)
const measures = {
  sideLength: sideBox.x1 - sideBox.x0,
  hornBack: -sideBox.x0,
  muzzle: sideBox.x1,
  earTipV: sideEar[1],
  skullTopV,
  neckFoot,
  neckFlare,
  neckFootWidth: frontFootXs.at(-1) - frontFootXs[0],
  hornSpread: frontBox.x1 - frontBox.x0,
  hornTipSpacing: 2 * hornZ(1),
  topLength: topBox.x1 - topBox.x0,
};

// ---------- carved band ----------
// One repeat in band coordinates: s along the side (peak of the zigzag at s = 0), h up from the band's bottom.
function bandMotif() {
  const P = band.repeat;
  const H = band.height;
  const groove = 0.012;
  const rim = 0.075;
  const win = 0.105;
  const beam = 0.05;
  const mainB = rim + win + beam;
  const mainT = H - mainB;
  const M = mainT - mainB;
  const rect = (s0, h0, s1, h1) => [[s0, h0], [s1, h0], [s1, h1], [s0, h1]];
  const raised = [
    rect(-P / 2, groove, P / 2, rim), rect(-P / 2, rim + win, P / 2, mainB),
    rect(-P / 2, mainT, P / 2, mainT + beam), rect(-P / 2, H - rim, P / 2, H - groove),
  ];
  // Window rows: six blocks per repeat, wide and narrow in turn, a wide one above each peak.
  const blockInset = 0.014;
  const wide = 0.07;
  const slim = 0.035;
  for (let k = -3; k <= 3; k++) {
    const half = (k % 2 === 0 ? wide : slim) / 2;
    const s = (k * P) / 6;
    raised.push(rect(s - half, rim + blockInset, s + half, rim + win - blockInset));
    raised.push(rect(s - half, mainT + beam + blockInset, s + half, H - rim - blockInset));
  }
  const m = ([s, f]) => [s, mainB + f * M]; // f runs 0 to 1 up the main row
  const T = 0.16; // zigzag strip thickness, share of the main row
  const U = (s) => 1 - (1 - T) * ((2 * Math.abs(s)) / P);
  raised.push([[-P / 2, U(-P / 2)], [0, 1], [P / 2, U(P / 2)], [P / 2, U(P / 2) - T], [0, 1 - T], [-P / 2, U(-P / 2) - T]].map(m));
  // Stepped pyramids: one standing under each peak, the same shape hanging in each valley.
  const steps = 5;
  const stepH = 0.118;
  const topHalf = 0.05 * P;
  const stepIn = 0.0707 * P;
  const left = [];
  for (let k = 0; k < steps; k++) {
    const a = topHalf + (steps - 1 - k) * stepIn;
    left.push([-a, k * stepH], [-a, (k + 1) * stepH]);
  }
  const pyramid = [...left, ...left.map(([s, f]) => [-s, f]).reverse()];
  const triangle = [[-0.135 * P, 0], [0, 0.23], [0.135 * P, 0]];
  const up = (shape) => shape.map(m);
  const hang = (shape, at) => shape.map(([s, f]) => m([at - s, 1 - f]));
  raised.push(up(pyramid), hang(pyramid, -P / 2), hang(pyramid, P / 2));
  const cut = [up(triangle), hang(triangle, -P / 2), hang(triangle, P / 2)];
  return {
    raised,
    cut,
    rows: { groove, rim, windowRow: win, beam, mainRow: M, mainBottom: mainB, mainTop: mainT, blockInset, wideBlock: wide, slimBlock: slim },
    zigzag: { thickness: T * M, rise: (1 - T) * M, slopeDeg: (Math.atan2((1 - T) * M, P / 2) * 180) / Math.PI },
    pyramid: { steps, stepHeight: stepH * M, topWidth: 2 * topHalf, stepInset: stepIn, baseWidth: 2 * (topHalf + (steps - 1) * stepIn) },
    triangle: { base: 0.27 * P, height: 0.23 * M },
  };
}
const motif = bandMotif();

// Position on the side for a distance s around the perimeter, starting at the middle of player A's side
// and running towards +x. Returns [x, z].
function perimPoint(s) {
  const W = body.halfWidth;
  const halfTurn = Math.PI * W;
  let q = ((s % perimeter) + perimeter) % perimeter;
  if (q <= endX) return [q, W];
  q -= endX;
  if (q <= halfTurn) return [endX + W * Math.sin(q / W), W * Math.cos(q / W)];
  q -= halfTurn;
  if (q <= 2 * endX) return [endX - q, -W];
  q -= 2 * endX;
  if (q <= halfTurn) return [-endX - W * Math.sin(q / W), -W * Math.cos(q / W)];
  return [-endX + q - halfTurn, W];
}
const subdivide = (poly, step) => poly.flatMap((p, i) => {
  const q = poly[(i + 1) % poly.length];
  const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / step));
  return Array.from({ length: n }, (_, k) => [p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n]);
});

// ---------- drawing ----------
const COL = {
  bg: '#0f3a64',
  line: '#eef5ff',
  thin: '#c4dbf7',
  dim: '#8fc4ff',
  centre: '#ffcf6e',
  hidden: '#a6c4ea',
  fill: 'rgba(255,255,255,0.07)',
  raised: 'rgba(255,255,255,0.16)',
  note: '#bcd6f5',
};
const ST = {
  visible: `fill="none" stroke="${COL.line}" stroke-width="1.6" stroke-linejoin="round"`,
  silhouette: `fill="${COL.fill}" stroke="${COL.line}" stroke-width="1.6" stroke-linejoin="round" fill-rule="evenodd"`,
  thin: `fill="none" stroke="${COL.thin}" stroke-width="0.8" stroke-linejoin="round"`,
  faint: `fill="none" stroke="${COL.thin}" stroke-width="0.6" opacity="0.55"`,
  hidden: `fill="none" stroke="${COL.hidden}" stroke-width="1" stroke-dasharray="6 4"`,
  centre: `fill="none" stroke="${COL.centre}" stroke-width="0.9" stroke-dasharray="16 4 3 4"`,
  section: `fill="url(#hatch)" stroke="${COL.line}" stroke-width="1.6" stroke-linejoin="round" fill-rule="evenodd"`,
  hole: `fill="${COL.bg}" stroke="${COL.line}" stroke-width="1.6"`,
  raised: `fill="${COL.raised}" stroke="${COL.line}" stroke-width="1.1" stroke-linejoin="round"`,
  cut: `fill="${COL.bg}" stroke="${COL.line}" stroke-width="1.1" stroke-linejoin="round"`,
};
const n1 = (v) => Math.round(v * 10) / 10;
const pathD = (pts, close = true) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${n1(x)} ${n1(y)}`).join('') + (close ? 'Z' : '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const trim = (v, d) => String(+v.toFixed(d));
// "605 (12.1)": millimetres, then game units in brackets.
const fmt = (p, { prefix = '' } = {}) => `${prefix}${trim(p * MM, Math.abs(p * MM) >= 100 ? 0 : 1)} (${trim(p, 3)})`;

// A view maps model coordinates (a, b) to the page: S pixels per p, with each axis flipped as needed.
const view = (ox, oy, S, sa = 1, sb2 = -1) => {
  const f = (a, b) => [ox + sa * a * S, oy + sb2 * b * S];
  f.S = S;
  f.pts = (list) => list.map(([a, b]) => f(a, b));
  return f;
};

class Sheet {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.parts = [];
  }

  raw(s) {
    this.parts.push(s);
    return this;
  }

  path(d, style) {
    return this.raw(`<path d="${d}" ${style}/>`);
  }

  poly(pts, style, close = true) {
    return this.path(pathD(pts, close), style);
  }

  line(a, b, style) {
    return this.path(pathD([a, b], false), style);
  }

  text(x, y, s, { size = 13, anchor = 'middle', rotate = 0, fill = COL.line, weight = 400, halo = true, mono = false } = {}) {
    const attrs = [
      `x="${n1(x)}" y="${n1(y)}"`, `font-size="${size}"`, `text-anchor="${anchor}"`, `fill="${fill}"`,
      'dominant-baseline="central"', weight !== 400 ? `font-weight="${weight}"` : '',
      rotate ? `transform="rotate(${n1(rotate)} ${n1(x)} ${n1(y)})"` : '',
      halo ? `stroke="${COL.bg}" stroke-width="4" paint-order="stroke" stroke-linejoin="round"` : '',
      mono ? 'font-family="Consolas, \'Courier New\', monospace"' : '',
    ];
    return this.raw(`<text ${attrs.filter(Boolean).join(' ')}>${esc(s)}</text>`);
  }

  // Aligned dimension between page points a and b, drawn off to the left of a->b (negative off: to the right).
  dim(a, b, off, label, { textShift = 0, ext = true } = {}) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ux = (b[0] - a[0]) / len;
    const uy = (b[1] - a[1]) / len;
    const nx = uy;
    const ny = -ux;
    const sg = Math.sign(off) || 1;
    const a2 = [a[0] + nx * off, a[1] + ny * off];
    const b2 = [b[0] + nx * off, b[1] + ny * off];
    if (ext) {
      for (const p of [a, b]) {
        this.line([p[0] + nx * sg * 3, p[1] + ny * sg * 3], [p[0] + nx * (off + sg * 5), p[1] + ny * (off + sg * 5)], `stroke="${COL.dim}" stroke-width="0.7"`);
      }
    }
    this.raw(`<path d="${pathD([a2, b2], false)}" stroke="${COL.dim}" stroke-width="0.8" fill="none" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`);
    let ang = (Math.atan2(uy, ux) * 180) / Math.PI;
    if (ang > 90.5) ang -= 180;
    if (ang < -89.5) ang += 180;
    const mx = (a2[0] + b2[0]) / 2 + ux * textShift;
    const my = (a2[1] + b2[1]) / 2 + uy * textShift;
    return this.text(mx, my, label, { size: 12.5, rotate: ang, fill: COL.dim });
  }

  leader(p, q, label, { anchor, size = 12.5 } = {}) {
    this.raw(`<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="2" fill="${COL.dim}"/>`);
    this.line(p, q, `stroke="${COL.dim}" stroke-width="0.8"`);
    const a = anchor ?? (q[0] >= p[0] ? 'start' : 'end');
    return this.text(q[0] + (a === 'start' ? 4 : a === 'end' ? -4 : 0), q[1], label, { size, anchor: a, fill: COL.dim });
  }

  title(x, y, s, sub) {
    this.text(x, y, s, { size: 17, anchor: 'start', weight: 600 });
    if (sub) this.text(x, y + 20, sub, { size: 12, anchor: 'start', fill: COL.note });
    return this;
  }

  // Rows of cells; each column is right-aligned at its x (SVG would collapse padding spaces).
  table(cols, y, rows, { gap = 18, size = 12.5 } = {}) {
    rows.forEach((row, i) => row.forEach((cell, j) => this.text(cols[j], y + i * gap, cell, {
      size, anchor: 'end', mono: true, halo: false, fill: i ? COL.line : COL.centre,
    })));
    return this;
  }

  notes(x, y, lines, { size = 12.5, gap = 18, width } = {}) {
    lines.forEach((l, i) => this.text(x, y + i * gap, l, { size, anchor: 'start', fill: COL.note, halo: false }));
    if (width) this.raw(`<rect x="${x - 10}" y="${y - 16}" width="${width}" height="${lines.length * gap + 14}" fill="none" stroke="${COL.thin}" stroke-width="0.6" opacity="0.5"/>`);
    return this;
  }

  titleBlock(n, name, scale) {
    const x = this.w - 440;
    const y = this.h - 150;
    this.raw(`<rect x="${x}" y="${y}" width="410" height="120" fill="${COL.bg}" stroke="${COL.line}" stroke-width="1.4"/>`);
    this.line([x, y + 34], [x + 410, y + 34], ST.thin);
    this.line([x, y + 86], [x + 410, y + 86], ST.thin);
    this.line([x + 250, y + 86], [x + 250, y + 120], ST.thin);
    this.text(x + 12, y + 17, 'GEBETA · Ethiopian traditional games', { size: 14, anchor: 'start', weight: 600, halo: false });
    this.text(x + 12, y + 50, name, { size: 16, anchor: 'start', weight: 600, halo: false });
    this.text(x + 12, y + 70, scale, { size: 11.5, anchor: 'start', fill: COL.note, halo: false });
    this.text(x + 12, y + 103, 'mm (game units p) · 1 p = 50 mm', { size: 11.5, anchor: 'start', fill: COL.note, halo: false });
    this.text(x + 262, y + 103, `Sheet ${n} of 3 · 2026-10-29`, { size: 11.5, anchor: 'start', fill: COL.note, halo: false });
    return this;
  }

  toString() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" font-family="'Segoe UI', 'Helvetica Neue', Arial, sans-serif">
<defs>
<pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="rgba(255,255,255,0.045)" stroke-width="1"/></pattern>
<pattern id="grid4" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/></pattern>
<pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="${COL.thin}" stroke-width="0.8" opacity="0.6"/></pattern>
<marker id="arrow" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M0 1.5L10 5L0 8.5Z" fill="${COL.dim}"/></marker>
</defs>
<rect width="100%" height="100%" fill="${COL.bg}"/>
<rect width="100%" height="100%" fill="url(#grid)"/>
<rect width="100%" height="100%" fill="url(#grid4)"/>
${this.parts.join('\n')}
</svg>
`;
  }
}

// Shapes shared by several views, all in page coordinates.
const stadium = (f, hl, hw) => {
  const S = f.S;
  const [cx, cy] = f(0, 0);
  const a = (hl - hw) * S;
  const r = hw * S;
  return `M${n1(cx - a)} ${n1(cy - r)}H${n1(cx + a)}A${n1(r)} ${n1(r)} 0 0 1 ${n1(cx + a)} ${n1(cy + r)}H${n1(cx - a)}A${n1(r)} ${n1(r)} 0 0 1 ${n1(cx - a)} ${n1(cy - r)}Z`;
};
// Rectangle with rounded top and bottom corners: page box x0 < x1, y0 (top) < y1.
const roundedBox = (x0, y0, x1, y1, rt, rb) => `M${n1(x0 + rt)} ${n1(y0)}H${n1(x1 - rt)}A${n1(rt)} ${n1(rt)} 0 0 1 ${n1(x1)} ${n1(y0 + rt)}`
  + `V${n1(y1 - rb)}A${n1(rb)} ${n1(rb)} 0 0 1 ${n1(x1 - rb)} ${n1(y1)}H${n1(x0 + rb)}A${n1(rb)} ${n1(rb)} 0 0 1 ${n1(x0)} ${n1(y1 - rb)}`
  + `V${n1(y0 + rt)}A${n1(rt)} ${n1(rt)} 0 0 1 ${n1(x0 + rt)} ${n1(y0)}Z`;
// Spherical cap seen in section: chord along the top face, bulging down (also in mirrored views).
const capPath = (f, c, diameter, sphereRadius) => {
  const [x0, y0] = f(c - diameter / 2, 0);
  const [x1] = f(c + diameter / 2, 0);
  const r = sphereRadius * f.S;
  return `M${n1(x0)} ${n1(y0)}A${n1(r)} ${n1(r)} 0 0 ${x1 > x0 ? 0 : 1} ${n1(x1)} ${n1(y0)}Z`;
};
const capArc = (f, c, diameter, sphereRadius) => capPath(f, c, diameter, sphereRadius).slice(0, -1);
const bodyElevation = (f) => {
  const [x0, y0] = f(-body.halfLength, 0);
  const [x1, y1] = f(body.halfLength, -body.thickness);
  return roundedBox(x0, y0, x1, y1, body.topEdgeRadius * f.S, body.bottomEdgeRadius * f.S);
};
// Foot seen from the side: square block, chamfered edges.
const drawFootSide = (sh, f, cx) => {
  const h = foot.size / 2;
  const c = foot.chamfer;
  const top = -body.thickness;
  const bot = top - foot.height;
  sh.poly(f.pts([[cx - h, top], [cx + h, top], [cx + h, bot + c], [cx + h - c, bot], [cx - h + c, bot], [cx - h, bot + c]]), ST.visible);
  sh.line(f(cx - h + c, top), f(cx - h + c, bot), ST.thin);
  sh.line(f(cx + h - c, top), f(cx + h - c, bot), ST.thin);
  sh.line(f(cx - h, bot + c), f(cx + h, bot + c), ST.thin);
};
// A side outline (u, v) placed on the board: the head at -x faces +x, the one at +x faces -x.
const leftHead = (pts) => pts.map(([u, v]) => [-head.x + u, v]);
const rightHead = (pts) => pts.map(([u, v]) => [head.x - u, v]);
const drawSilhouette = (sh, f, loops, style = ST.silhouette) => sh.path(loops.map((l) => pathD(f.pts(l))).join(''), style);

// Draws band motif repeats onto a view through a mapping from (s, h) to model (a, b).
function drawBand(sh, f, kFrom, kTo, toModel, style = ST.faint) {
  const d = [];
  for (let k = kFrom; k <= kTo; k++) {
    for (const poly of [...motif.raised, ...motif.cut]) {
      const pts = subdivide(poly, 0.03).map(([s, h]) => toModel(s + k * band.repeat, h));
      d.push(pathD(f.pts(pts)));
    }
  }
  sh.path(d.join(''), style);
}

// ---------- sheet 1: the board ----------
function boardSheet() {
  const sh = new Sheet(1920, 2080);
  const S = 100;
  sh.title(60, 36, 'Gebeta board · general arrangement', 'Carved wanza wood with two Walia ibex heads. Third-angle projection. 1 p = 100 px (1 px = 0.5 mm) unless marked.');

  // Plan
  const plan = view(780, 300, S, 1, 1);
  sh.text(90, 150, 'PLAN', { size: 13, anchor: 'start', weight: 600 });
  sh.text(90, 168, '(from above)', { size: 12, anchor: 'start', fill: COL.note });
  sh.path(stadium(plan, body.halfLength, body.halfWidth), ST.visible);
  sh.path(stadium(plan, body.halfLength - body.topEdgeRadius, body.halfWidth - body.topEdgeRadius), ST.thin);
  for (const ft of feet) {
    const h = foot.size / 2;
    sh.poly(plan.pts([[ft.x - h, ft.z - h], [ft.x + h, ft.z - h], [ft.x + h, ft.z + h], [ft.x - h, ft.z + h]]), ST.hidden);
  }
  for (const c of cups) {
    const [cx, cy] = plan(c.x, c.z);
    sh.raw(`<circle cx="${cx}" cy="${cy}" r="${(cup.diameter / 2) * S}" ${ST.visible}/>`);
    sh.raw(`<circle cx="${cx}" cy="${cy}" r="${(cup.diameter / 2 - cup.rimRadius) * S}" ${ST.thin}/>`);
    sh.text(cx, cy, String(c.hole), { size: 15, weight: 600, halo: false });
  }
  for (const st of stores) {
    const [cx, cy] = plan(st.x, st.z);
    sh.raw(`<circle cx="${cx}" cy="${cy}" r="${(store.diameter / 2) * S}" ${ST.visible}/>`);
    sh.raw(`<circle cx="${cx}" cy="${cy}" r="${(store.diameter / 2 - store.rimRadius) * S}" ${ST.thin}/>`);
  }
  drawSilhouette(sh, plan, topSilhouette.map((l) => l.map(([u, w]) => [-head.x + u, w])));
  drawSilhouette(sh, plan, topSilhouette.map((l) => l.map(([u, w]) => [head.x - u, -w])));
  sh.line(plan(-6.9, 0), plan(6.9, 0), ST.centre);
  sh.line(plan(0, -1.5), plan(0, 1.5), ST.centre);
  for (const x of [-head.x, head.x]) sh.line(plan(x, -1.35), plan(x, 1.35), ST.centre);
  sh.text(...plan(store.x, 0.95), 'store A', { size: 12, fill: COL.note });
  sh.text(...plan(-store.x, 0.95), 'store B', { size: 12, fill: COL.note });
  sh.raw(`<path d="${pathD([plan(-1.9, 1.06), plan(1.9, 1.06)], false)}" stroke="${COL.centre}" stroke-width="1" marker-end="url(#arrow)" fill="none"/>`);
  sh.raw(`<path d="${pathD([plan(1.9, -1.06), plan(-1.9, -1.06)], false)}" stroke="${COL.centre}" stroke-width="1" marker-end="url(#arrow)" fill="none"/>`);
  sh.text(...plan(0, 1.06), 'sowing', { size: 11, fill: COL.centre });
  sh.text(...plan(0, -1.06), 'sowing', { size: 11, fill: COL.centre });
  sh.dim(plan(-store.x, -0.7), plan(store.x, -0.7), 80, `stores ${fmt(2 * store.x)}`);
  sh.dim(plan(-head.x, -0.6), plan(head.x, -0.6), 118, `neck axes ${fmt(2 * head.x)}`);
  sh.dim(plan(-body.halfLength, 0), plan(body.halfLength, 0), 206, `overall ${fmt(2 * body.halfLength)}`);
  sh.dim(plan(-2.5, cup.rowZ), plan(2.5, cup.rowZ), -94.5, `5 × pitch ${fmt(cup.pitch)} = ${fmt(5)}`);
  sh.dim(plan(-foot.x, foot.z), plan(foot.x, foot.z), -108, `feet ${fmt(2 * foot.x)}`);
  sh.leader(plan(endX + body.halfWidth * Math.cos(0.6), body.halfWidth * Math.sin(0.6)), plan(6.45, 1.5), `R ${fmt(body.halfWidth)}`, { anchor: 'start' });
  sh.dim(plan(head.x + 0.4, measures.hornSpread / 2), plan(head.x + 0.4, -measures.hornSpread / 2), -125, `horns ${fmt(measures.hornSpread)}`);
  sh.notes(1585, 168, [
    'Player A sits at the bottom edge (+z),',
    'player B at the top edge.',
    'A plays holes 0–5, B plays 6–11;',
    'sowing runs anticlockwise from above.',
    'Each store is on its owner\'s right:',
    'A\'s at +x, B\'s at −x.',
    'Dashed squares: the feet underneath.',
    'Cup Ø: section C–C. Store Ø: B–B.',
  ], { size: 12, gap: 18, width: 300 });

  // Front elevation
  const fe = view(780, 915, S);
  sh.text(90, 520, 'FRONT ELEVATION', { size: 13, anchor: 'start', weight: 600 });
  sh.text(90, 538, '(from player A)', { size: 12, anchor: 'start', fill: COL.note });
  sh.path(bodyElevation(fe), ST.visible);
  for (const y of [-body.topEdgeRadius, -body.thickness + body.bottomEdgeRadius]) sh.line(fe(-body.halfLength, y), fe(body.halfLength, y), ST.thin);
  for (const y of [band.bottomY, band.bottomY + band.height]) sh.line(fe(-body.halfLength + 0.05, y), fe(body.halfLength - 0.05, y), ST.thin);
  const frontLimit = endX + (Math.PI / 2) * body.halfWidth;
  drawBand(sh, fe, -8, 8, (s, h) => [perimPoint(Math.max(-frontLimit, Math.min(frontLimit, s)))[0], band.bottomY + h]);
  for (const x of [-foot.x, foot.x]) drawFootSide(sh, fe, x);
  for (const c of cups.slice(0, 6)) sh.path(capArc(fe, c.x, cup.diameter, cup.sphereRadius), ST.hidden);
  for (const st of stores) sh.path(capArc(fe, st.x, store.diameter, store.sphereRadius), ST.hidden);
  drawSilhouette(sh, fe, [leftHead(sideOutline)]);
  drawSilhouette(sh, fe, [rightHead(sideOutline)]);
  for (const x of [-head.x, head.x]) sh.line(fe(x, -2.0), fe(x, head.height + 0.15), ST.centre);
  sh.line(fe(0, -2.0), fe(0, 0.6), ST.centre);
  const footLeft = -foot.x - foot.size / 2;
  sh.dim(fe(-body.halfLength, -body.thickness), fe(-body.halfLength, 0), 40, fmt(body.thickness));
  sh.dim(fe(footLeft, -body.thickness - foot.height), fe(footLeft, -body.thickness), 52, fmt(foot.height));
  sh.dim(fe(-6.95, -body.thickness - foot.height), fe(-6.95, head.height), 40, `overall ${fmt(head.height + body.thickness + foot.height)}`);
  sh.dim(fe(head.x, 0), fe(head.x, head.height), -205, `head ${fmt(head.height)}`);
  sh.dim(fe(body.halfLength, band.bottomY), fe(body.halfLength, band.bottomY + band.height), -45, `band ${fmt(band.height)}`);
  sh.dim(fe(footLeft, -body.thickness - foot.height), fe(footLeft + foot.size, -body.thickness - foot.height), -26, fmt(foot.size));
  sh.dim(fe(head.x - measures.muzzle, head.height + 0.1), fe(head.x, head.height + 0.1), 22, `muzzle ${fmt(measures.muzzle)}`, { ext: false });
  sh.dim(fe(head.x, head.height + 0.1), fe(head.x + measures.hornBack, head.height + 0.1), 22, `horn ${fmt(measures.hornBack)}`, { ext: false });
  sh.text(...fe(0, -1.62), 'cups and stores hidden (dashed) · band motif: sheet 3', { size: 12, fill: COL.note });

  // End elevation
  const en = view(1745, 915, S, -1, -1);
  sh.text(1600, 520, 'END ELEVATION', { size: 13, anchor: 'start', weight: 600 });
  sh.text(1600, 538, '(from +x, store A end)', { size: 12, anchor: 'start', fill: COL.note });
  {
    const [x0, y0] = en(body.halfWidth, 0);
    const [x1, y1] = en(-body.halfWidth, -body.thickness);
    sh.path(roundedBox(x0, y0, x1, y1, body.topEdgeRadius * S, body.bottomEdgeRadius * S), ST.visible);
    for (const y of [-body.topEdgeRadius, -body.thickness + body.bottomEdgeRadius, band.bottomY, band.bottomY + band.height]) {
      sh.line(en(body.halfWidth - 0.02, y), en(-body.halfWidth + 0.02, y), ST.thin);
    }
    drawBand(sh, en, 5, 11, (s, h) => [perimPoint(Math.max(endX, Math.min(endX + Math.PI * body.halfWidth, s)))[1], band.bottomY + h]);
    for (const z of [-foot.z, foot.z]) drawFootSide(sh, en, z);
    drawSilhouette(sh, en, frontSilhouette.map((l) => l.map(([w, v]) => [-w, v])));
    sh.line(en(0, -2.0), en(0, head.height + 0.15), ST.centre);
    sh.dim(en(body.halfWidth, -1.85), en(-body.halfWidth, -1.85), -30, fmt(2 * body.halfWidth));
    sh.dim(en(foot.z, -1.8), en(-foot.z, -1.8), -70, `feet ${fmt(2 * foot.z)}`);
    sh.dim(en(measures.hornSpread / 2, head.height + 0.05), en(-measures.hornSpread / 2, head.height + 0.05), 26, `horns ${fmt(measures.hornSpread)}`);
    sh.text(1745, 1200, 'player A side ←   → player B side', { size: 11.5, fill: COL.note });
  }

  // Section B-B: lengthways on the centre line, through both stores and both necks
  const bb = view(780, 1330, S);
  sh.text(90, 1160, 'SECTION B–B', { size: 13, anchor: 'start', weight: 600 });
  sh.text(90, 1178, '(lengthways on the centre line, z = 0)', { size: 12, anchor: 'start', fill: COL.note });
  const cutV = 0.4; // below the beard, so only the neck is cut
  sh.raw(`<clipPath id="neckClip"><rect x="0" y="${bb(0, cutV)[1]}" width="1920" height="${cutV * S + 2}"/></clipPath>`);
  sh.raw('<g clip-path="url(#neckClip)">');
  sh.path(pathD(bb.pts(leftHead(sideHeadOutline))) + pathD(bb.pts(rightHead(sideHeadOutline))), ST.section);
  sh.raw('</g>');
  for (const place of [leftHead, rightHead]) {
    const xs = crossings(sideHeadOutline, cutV);
    const [a, b] = place([[xs[0] - 0.06, cutV], [xs.at(-1) + 0.06, cutV]]).map(([x]) => x).sort((p, q) => p - q);
    const zig = [[a, cutV], [(2 * a + b) / 3, cutV], [(a + b) / 2 - 0.04, cutV + 0.07], [(a + b) / 2 + 0.04, cutV - 0.07], [(a + 2 * b) / 3, cutV], [b, cutV]];
    sh.poly(bb.pts(zig), ST.thin, false);
  }
  sh.path(bodyElevation(bb), ST.section);
  for (const st of stores) sh.path(capPath(bb, st.x, store.diameter, store.sphereRadius), ST.hole);
  for (const x of [-foot.x, foot.x]) drawFootSide(sh, bb, x);
  sh.line(bb(-6.9, 0), bb(6.9, 0), ST.centre);
  for (const x of [-head.x, head.x, -store.x, store.x]) sh.line(bb(x, -1.5), bb(x, 0.45), ST.centre);
  sh.dim(bb(-store.x - store.diameter / 2, 0.05), bb(-store.x + store.diameter / 2, 0.05), 34, `Ø ${fmt(store.diameter)}`);
  sh.dim(bb(store.x, -store.depth), bb(store.x, 0), 0.1, `depth ${fmt(store.depth)}`, { ext: false });
  const sc = store.sphereRadius - store.depth;
  const arcPt = [store.x + store.sphereRadius * Math.cos((-120 * Math.PI) / 180), sc + store.sphereRadius * Math.sin((-120 * Math.PI) / 180)];
  sh.leader(bb(...arcPt), bb(2.3, -1.62), `sphere R ${fmt(store.sphereRadius)}`, { anchor: 'end' });
  sh.dim(bb(-head.x + neckFoot[0], 0), bb(-head.x + neckFoot[1], 0), 112, `neck foot ${fmt(neckFoot[1] - neckFoot[0])}`);
  const clear = head.x + neckFlare[0] - store.x - store.diameter / 2;
  sh.leader(bb(-store.x - store.diameter / 2 - clear / 2, 0.02), bb(-2.9, 0.75), `${fmt(clear)} clear between neck flare and store`, { anchor: 'start' });
  sh.text(...bb(0.6, 0.4), `necks broken off above ${fmt(cutV)} · head and board are one carving`, { size: 12, fill: COL.note });

  // Section C-C across, through holes 2 and 9
  const D = 200;
  const cc = view(400, 1660, D, -1, -1);
  sh.text(90, 1560, 'SECTION C–C · 1 p = 200 px', { size: 13, anchor: 'start', weight: 600 });
  sh.text(90, 1578, '(across, through holes 2 and 9; player A on the left)', { size: 12, anchor: 'start', fill: COL.note });
  {
    const [x0, y0] = cc(body.halfWidth, 0);
    const [x1, y1] = cc(-body.halfWidth, -body.thickness);
    sh.path(roundedBox(x0, y0, x1, y1, body.topEdgeRadius * D, body.bottomEdgeRadius * D), ST.section);
    for (const z of [cup.rowZ, -cup.rowZ]) sh.path(capPath(cc, z, cup.diameter, cup.sphereRadius), ST.hole);
    for (const y of [band.bottomY, band.bottomY + band.height]) {
      sh.line(cc(body.halfWidth, y), cc(body.halfWidth + 0.08, y), ST.thin);
      sh.line(cc(-body.halfWidth, y), cc(-body.halfWidth - 0.08, y), ST.thin);
    }
    sh.line(cc(0, -1.45), cc(0, 0.3), ST.centre);
    for (const z of [cup.rowZ, -cup.rowZ]) sh.line(cc(z, -0.6), cc(z, 0.3), ST.centre);
    const cupEdge = cup.rowZ - cup.diameter / 2;
    sh.dim(cc(cup.rowZ, 0.12), cc(-cup.rowZ, 0.12), 22, fmt(2 * cup.rowZ));
    sh.dim(cc(-cupEdge, 0.02), cc(-cup.rowZ - cup.diameter / 2, 0.02), 62, `cup Ø ${fmt(cup.diameter)}`);
    sh.dim(cc(cupEdge - 0.02, -cup.depth), cc(cupEdge - 0.02, 0), -24, fmt(cup.depth));
    sh.dim(cc(-cup.rowZ, -body.thickness), cc(-cup.rowZ, -cup.depth), 0.1, fmt(body.thickness - cup.depth), { ext: false });
    sh.dim(cc(body.halfWidth, 0.02), cc(cup.rowZ + cup.diameter / 2, 0.02), 30, fmt(body.halfWidth - cup.rowZ - cup.diameter / 2), { textShift: -40 });
    sh.dim(cc(body.halfWidth, -body.thickness), cc(-body.halfWidth, -body.thickness), -34, fmt(2 * body.halfWidth));
    sh.dim(cc(-body.halfWidth, -body.thickness), cc(-body.halfWidth, 0), -34, fmt(body.thickness));
    const cupArc = [cup.rowZ + cup.sphereRadius * 0.5, cup.sphereRadius - cup.depth - cup.sphereRadius * 0.866];
    sh.leader(cc(...cupArc), cc(0.2, -0.85), `sphere R ${fmt(cup.sphereRadius)}`, { anchor: 'start' });
    const rt = body.topEdgeRadius;
    const rb = body.bottomEdgeRadius;
    sh.leader(cc(-body.halfWidth + rt * (1 - Math.SQRT1_2), -rt * (1 - Math.SQRT1_2)), cc(-body.halfWidth - 0.32, 0.22), `R ${fmt(rt)}`, { anchor: 'start' });
    sh.leader(cc(-body.halfWidth + rb * (1 - Math.SQRT1_2), -body.thickness + rb * (1 - Math.SQRT1_2)), cc(-body.halfWidth - 0.45, -body.thickness - 0.28), `R ${fmt(rb)}`, { anchor: 'start' });
  }

  // Foot detail
  sh.text(1000, 1560, 'FOOT (4 off) · 1 p = 200 px', { size: 13, anchor: 'start', weight: 600 });
  {
    const h = foot.size / 2;
    const c = foot.chamfer;
    const fx = view(1150, 1650, D);
    const fe2 = (x, y) => fx(x, y + body.thickness); // foot top at the view origin
    fe2.S = D;
    fe2.pts = (l) => l.map(([a, b]) => fe2(a, b));
    drawFootSide(sh, fe2, 0);
    sh.line(fe2(-h - 0.15, -body.thickness), fe2(h + 0.15, -body.thickness), ST.faint);
    sh.dim(fe2(-h, -body.thickness - foot.height), fe2(h, -body.thickness - foot.height), -26, fmt(foot.size));
    sh.dim(fe2(h, -body.thickness - foot.height), fe2(h, -body.thickness), -30, fmt(foot.height));
    sh.leader(fe2(-h + c / 2, -body.thickness - foot.height + c / 2), fe2(-h - 0.3, -body.thickness - foot.height - 0.2), `chamfer ${fmt(c)}, all free edges`);
    const fp = view(1450, 1705, D, 1, 1);
    sh.poly(fp.pts([[-h + c, -h], [h - c, -h], [h, -h + c], [h, h - c], [h - c, h], [-h + c, h], [-h, h - c], [-h, -h + c]]), ST.visible);
    sh.poly(fp.pts([[-h + c, -h + c], [h - c, -h + c], [h - c, h - c], [-h + c, h - c]]), ST.thin);
    sh.text(...fp(0, h + 0.2), 'underside', { size: 12, fill: COL.note });
    sh.text(...fp(0, -h - 0.2), `centres x ±${trim(foot.x * MM, 0)}, z ±${trim(foot.z * MM, 0)}`, { size: 12, fill: COL.note });
  }

  sh.notes(1000, 1862, [
    'Cup and store rims R 1.5 (0.03). Neck foot blends into the top with R 7.5 (0.15).',
    'Hole numbers are the game\'s. Head and horns: sheet 2. Carved band: sheet 3.',
  ], { size: 12.5, gap: 19 });
  sh.titleBlock(1, 'Board · general arrangement', 'Plan, elevations and B–B 1 p = 100 px; C–C and foot 1 p = 200 px');
  return sh;
}

// ---------- sheet 2: the ibex head ----------
function headSheet() {
  const sh = new Sheet(2000, 1760);
  const S = 200;
  sh.title(60, 36, 'Walia ibex head · one of two', 'Shown for the head at the −x end (store B), facing +x. The head at +x is the same turned 180°. 1 p = 200 px (1 px = 0.25 mm).');

  // Top view, above the side view on the same u axis
  const top = view(430, 400, S, 1, 1);
  sh.text(90, 140, 'TOP VIEW', { size: 13, anchor: 'start', weight: 600 });
  sh.text(90, 158, '(player A side down)', { size: 12, anchor: 'start', fill: COL.note });
  drawSilhouette(sh, top, topSilhouette);
  sh.path(pathD(top.pts(topHeadOnly)), ST.hidden);
  for (const side of [-1, 1]) sh.path(pathD(top.pts(hornStations.map((h) => [h.u, side * h.z])), false), ST.centre);
  sh.line(top(0, -1.3), top(0, 1.3), ST.centre);
  sh.line(top(-1.8, 0), top(1.9, 0), ST.centre);
  sh.dim(top(topBox.x0, topBox.y0), top(topBox.x1, topBox.y0), 38, fmt(topBox.x1 - topBox.x0));
  sh.dim(top(topBox.x1, topBox.y1), top(topBox.x1, topBox.y0), -40, `horns ${fmt(topBox.y1 - topBox.y0)}`);

  // Side view
  const sv = view(430, 1430, S);
  sh.text(90, 700, 'SIDE VIEW', { size: 13, anchor: 'start', weight: 600 });
  sh.text(90, 718, '(from player A) · master view', { size: 12, anchor: 'start', fill: COL.note });
  drawSilhouette(sh, sv, [sideOutline]);
  sh.path(pathD(sv.pts(sideHeadOutline)), ST.hidden);
  sh.path(pathD(sv.pts(hornStations.map((h) => [h.u, h.v])), false), ST.centre);
  for (let k = 0; k <= 10; k++) {
    const h = hornStations[k * 4];
    const nx = Math.cos(h.th);
    const ny = Math.sin(h.th);
    sh.line(sv(h.u - (nx * h.depth) / 2, h.v - (ny * h.depth) / 2), sv(h.u + (nx * h.depth) / 2, h.v + (ny * h.depth) / 2), `stroke="${COL.centre}" stroke-width="1"`);
    const lab = sv(h.u - nx * (h.depth / 2 + 0.12), h.v - ny * (h.depth / 2 + 0.12));
    sh.text(lab[0], lab[1], `t${trim(h.t, 1)}`, { size: 11, fill: COL.centre });
  }
  ridges.forEach((r, k) => {
    const h = hornAt(r.t * hornLength);
    const p = sv(h.u + Math.cos(h.th) * (h.depth / 2 + 0.07), h.v + Math.sin(h.th) * (h.depth / 2 + 0.07));
    sh.raw(`<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="2.2" fill="${COL.centre}"/>`);
    if (k % 4 === 0 || k === ridges.length - 1) {
      const q = sv(h.u + Math.cos(h.th) * (h.depth / 2 + 0.19), h.v + Math.sin(h.th) * (h.depth / 2 + 0.19));
      sh.text(q[0], q[1], String(k + 1), { size: 10.5, fill: COL.centre });
    }
  });
  sh.line(sv(0, -0.15), sv(0, head.height + 0.1), ST.centre);
  sh.line(sv(-1.8, 0), sv(1.9, 0), ST.thin);
  sh.text(...sv(1.5, -0.1), 'board top face', { size: 11.5, fill: COL.note });
  sh.dim(sv(sideBox.x0, -0.25), sv(sideBox.x1, -0.25), -30, fmt(measures.sideLength));
  sh.dim(sv(sideBox.x0, -0.25), sv(0, -0.25), -62, `horn back ${fmt(measures.hornBack)}`);
  sh.dim(sv(0, -0.25), sv(sideBox.x1, -0.25), -62, `muzzle ${fmt(measures.muzzle)}`);
  sh.dim(sv(neckFoot[0], 0), sv(neckFoot[1], 0), -112, `neck foot ${fmt(neckFoot[1] - neckFoot[0])}`);
  sh.dim(sv(sideBox.x1 + 0.1, 0), sv(sideBox.x1 + 0.1, head.height), -40, fmt(head.height));
  sh.dim(sv(sideBox.x1 + 0.1, 0), sv(sideBox.x1 + 0.1, measures.earTipV), -95, `ear tip ${fmt(measures.earTipV)}`);
  sh.dim(sv(sideBox.x1 + 0.1, 0), sv(sideBox.x1 + 0.1, skullTopV), -150, `skull ${fmt(skullTopV)}`);

  // Face view, to the right of the side view
  const fv2 = view(1190, 1430, S, -1, -1);
  sh.text(960, 700, 'FACE VIEW', { size: 13, anchor: 'start', weight: 600 });
  sh.text(960, 718, '(from +x)', { size: 12, anchor: 'start', fill: COL.note });
  drawSilhouette(sh, fv2, frontSilhouette);
  sh.path(pathD(fv2.pts(frontHeadOutline)), ST.hidden);
  for (const side of [-1, 1]) sh.path(pathD(fv2.pts(hornStations.map((h) => [side * h.z, h.v])), false), ST.centre);
  sh.line(fv2(0, -0.15), fv2(0, head.height + 0.1), ST.centre);
  sh.line(fv2(-1.3, 0), fv2(1.3, 0), ST.thin);
  sh.dim(fv2(frontBox.x1, head.height + 0.05), fv2(frontBox.x0, head.height + 0.05), 30, `horn spread ${fmt(measures.hornSpread)}`);
  sh.dim(fv2(hornZ(1), 0.35), fv2(-hornZ(1), 0.35), 0.1, `tips ${fmt(measures.hornTipSpacing)}`, { ext: false });
  sh.dim(fv2(EAR_HALF, measures.earTipV), fv2(-EAR_HALF, measures.earTipV), -60, `ears ${fmt(2 * EAR_HALF)}`);
  sh.dim(fv2(frontFootXs.at(-1), 0), fv2(frontFootXs[0], 0), -30, `neck foot ${fmt(measures.neckFootWidth)}`);
  sh.dim(fv2(NECK_HALF, 0.95), fv2(-NECK_HALF, 0.95), 0.1, `neck ${fmt(2 * NECK_HALF)}`, { ext: false });
  sh.text(...fv2(0, -0.45), 'player A side ←   → player B side', { size: 11.5, fill: COL.note });

  // Horn data
  const tx = 1480;
  sh.text(tx, 140, 'HORN · two, a mirror pair', { size: 13, anchor: 'start', weight: 600 });
  sh.notes(tx, 168, [
    'Swept along its centre line (u, v, ±z); the section',
    'is an oval: depth d across the curl in the side view,',
    'width w sideways. All in p; t = 0 root, 1 tip.',
  ], { size: 12, gap: 17 });
  const hornCols = [1500, 1575, 1650, 1725, 1800, 1875];
  sh.table(hornCols, 236, [['t', 'u', 'v', 'z', 'd', 'w'],
    ...hornStations.filter((_, k) => k % 4 === 0).map((h) => [h.t.toFixed(1), ...[h.u, h.v, h.z, h.depth, h.width].map((v) => v.toFixed(3))])]);
  const ry = 236 + 12 * 18 + 34;
  sh.text(tx, ry, `RIDGES · ${ridges.length} across the outer face`, { size: 13, anchor: 'start', weight: 600 });
  sh.notes(tx, ry + 26, [
    'Placed at centre-line t; gap and rise in mm, gap',
    'measured along the outer edge. Each ridge is about',
    'half its gap wide, rounded, running across the face.',
  ], { size: 12, gap: 17 });
  const ridgeCols = [1505, 1580, 1660, 1740];
  sh.table(ridgeCols, ry + 92, [['#', 't', 'gap', 'rise'],
    ...ridges.map((r, k) => [String(k + 1), r.t.toFixed(3), k ? trim((r.outer - ridges[k - 1].outer) * MM, 1) : '–', trim(r.height * MM, 1)])], { gap: 16.5 });

  // Horn sections
  const sy = ry + 92 + (ridges.length + 1) * 16.5 + 40;
  const SS = 300;
  sh.text(tx, sy, `HORN SECTIONS · 1 p = ${SS} px`, { size: 13, anchor: 'start', weight: 600 });
  let cx = tx;
  [0.1, 0.45, 0.8].forEach((t) => {
    const h = hornAt(t * hornLength);
    const a = (h.width / 2) * SS;
    const b = (h.depth / 2) * SS;
    cx += a + 14;
    const cy = sy + 30 + (hornAt(0.1 * hornLength).depth / 2) * SS + 8;
    sh.raw(`<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(a)}" ry="${n1(b)}" fill="url(#hatch)" stroke="${COL.line}" stroke-width="1.4"/>`);
    const rh = ridges.reduce((s, r) => s + r.height, 0) / ridges.length * SS;
    sh.raw(`<path d="M${n1(cx - a * 0.75)} ${n1(cy - b * 0.66)}Q${n1(cx)} ${n1(cy - b - 2 * rh)} ${n1(cx + a * 0.75)} ${n1(cy - b * 0.66)}" ${ST.thin} stroke-dasharray="3 2"/>`);
    sh.text(cx, cy + b + 16, `t${t}`, { size: 12, fill: COL.centre });
    sh.text(cx, cy + b + 32, `${trim(h.depth * MM, 1)} × ${trim(h.width * MM, 1)}`, { size: 11.5, fill: COL.dim });
    cx += a + 14;
  });
  sh.notes(tx, sy + 30 + hornAt(0.1 * hornLength).depth * SS + 70, ['Depth × width in mm. The top of each oval faces', 'the outside of the curl; dashed: a ridge on it.'], { size: 12, gap: 17 });

  sh.notes(90, 1640, [
    'Dashed: the head without horns. Build it as side ∩ face ∩ top (side view is the master), then sweep the horns. Ridge dots on the side view, numbered every fourth.',
    'Side view traced from image 13, scaled to 160 (3.2) tall. Face view traced from 14, narrowed to the neck and ears of 04; horns rebuilt to the spread of the end view 04.',
    'Top view traced from 09, fitted at the muzzle and ear tips; behind the ears it is filled in from the side and face views. Head and neck are carved in one with the board.',
  ], { size: 12, gap: 18 });
  sh.titleBlock(2, 'Walia ibex head', `Views 1 p = 200 px; horn sections 1 p = ${SS} px`);
  return sh;
}

// ---------- sheet 3: the carved band ----------
function bandSheet() {
  const sh = new Sheet(1800, 1560);
  const P = band.repeat;
  const H = band.height;
  sh.title(60, 36, 'Carved side band · tilet zigzag between Aksum stelae windows', `Runs right round the board: ${band.repeats} equal repeats of ${fmt(P)}. Raised parts are the original surface; the rest is cut ${fmt(band.relief)} deep.`);

  const S = 700;
  const rp = view(560, 840, S); // s across (peak at 0), h up from the band's bottom
  sh.text(90, 100, 'ONE REPEAT · 1 p = 700 px', { size: 13, anchor: 'start', weight: 600 });
  const clipW = 0.78 * P;
  sh.raw(`<clipPath id="repeatClip"><rect x="${n1(rp(-clipW, 0)[0])}" y="${n1(rp(0, H)[1])}" width="${n1(2 * clipW * S)}" height="${n1(H * S)}"/></clipPath>`);
  sh.raw(`<clipPath id="oneRepeat"><rect x="${n1(rp(-P / 2, 0)[0])}" y="${n1(rp(0, H)[1])}" width="${n1(P * S)}" height="${n1(H * S)}"/></clipPath>`);
  const motifPaths = (dx) => ({
    raised: motif.raised.map((p) => pathD(rp.pts(p.map(([s, h]) => [s + dx, h])))).join(''),
    cut: motif.cut.map((p) => pathD(rp.pts(p.map(([s, h]) => [s + dx, h])))).join(''),
  });
  sh.raw('<g clip-path="url(#repeatClip)" opacity="0.35">');
  for (const dx of [-P, P]) {
    const m = motifPaths(dx);
    sh.path(m.raised, ST.raised).path(m.cut, ST.cut);
  }
  sh.raw('</g><g clip-path="url(#oneRepeat)">');
  const m0 = motifPaths(0);
  sh.path(m0.raised, ST.raised).path(m0.cut, ST.cut);
  sh.raw('</g>');
  sh.poly(rp.pts([[-clipW, 0], [clipW, 0], [clipW, H], [-clipW, H]]), ST.thin);
  for (const s of [-P / 2, P / 2]) sh.line(rp(s, -0.04), rp(s, H + 0.04), ST.centre);
  sh.line(rp(0, -0.04), rp(0, H + 0.04), ST.centre);
  sh.dim(rp(-P / 2, H + 0.02), rp(P / 2, H + 0.02), 40, `repeat ${fmt(P)}`);
  sh.dim(rp(-clipW - 0.02, 0), rp(-clipW - 0.02, H), 34, `band ${fmt(H)}`);

  // Row heights: a tick at every boundary, the name and height beside each row.
  const r = motif.rows;
  const rowsUp = [
    ['edge groove', r.groove], ['rim', r.rim - r.groove], ['window row', r.windowRow], ['beam', r.beam], ['tilet row', r.mainRow],
    ['beam', r.beam], ['window row', r.windowRow], ['rim', r.rim - r.groove], ['edge groove', r.groove],
  ];
  const xT = clipW + 0.03;
  sh.line(rp(xT, 0), rp(xT, H), `stroke="${COL.dim}" stroke-width="0.8"`);
  let h0 = 0;
  for (const [name, size] of rowsUp) {
    sh.line(rp(xT - 0.012, h0), rp(xT + 0.012, h0), `stroke="${COL.dim}" stroke-width="0.8"`);
    if (size > 0.03) sh.text(rp(xT + 0.03, 0)[0], rp(0, h0 + size / 2)[1], `${name} ${fmt(size)}`, { size: 12, anchor: 'start', fill: COL.dim });
    h0 += size;
  }
  sh.line(rp(xT - 0.012, H), rp(xT + 0.012, H), `stroke="${COL.dim}" stroke-width="0.8"`);
  sh.text(rp(xT + 0.03, 0)[0], rp(0, H)[1] - 16, `edge grooves ${fmt(r.groove)}, top and bottom`, { size: 12, anchor: 'start', fill: COL.dim });

  // Motif dimensions
  const mb = r.mainBottom;
  const py = motif.pyramid;
  sh.dim(rp(-py.baseWidth / 2, mb), rp(py.baseWidth / 2, mb), -18, `pyramid base ${fmt(py.baseWidth)}`);
  sh.dim(rp(-py.topWidth / 2, mb + py.steps * py.stepHeight), rp(py.topWidth / 2, mb + py.steps * py.stepHeight), 16, fmt(py.topWidth));
  sh.dim(rp(py.topWidth / 2 + py.stepInset, mb + 3 * py.stepHeight), rp(py.topWidth / 2 + py.stepInset, mb + 4 * py.stepHeight), -24, `step ${fmt(py.stepHeight)}`);
  sh.dim(rp(py.topWidth / 2, mb + 4 * py.stepHeight + 0.004), rp(py.topWidth / 2 + py.stepInset, mb + 4 * py.stepHeight + 0.004), 18, fmt(py.stepInset), { ext: false });
  const zz = motif.zigzag;
  const below = rp(0, 0)[1];
  sh.leader(rp(0.02, mb + 0.03), [rp(0.12, 0)[0], below + 40], `cut triangle ${fmt(motif.triangle.base)} wide, ${fmt(motif.triangle.height)} high`, { anchor: 'start' });
  sh.leader(rp(-P / 4 - 0.02, mb + r.mainRow * 0.47), [rp(-0.3, 0)[0], below + 40], `zigzag strip ${fmt(zz.thickness)} tall, slope ${trim(zz.slopeDeg, 1)}°`, { anchor: 'end' });
  sh.leader(rp(0, r.rim + r.windowRow / 2), [rp(-0.05, 0)[0], below + 66], `window blocks ${fmt(r.wideBlock)} and ${fmt(r.slimBlock)} wide in turn, every ${fmt(P / 6)}, ${fmt(r.windowRow - 2 * r.blockInset)} tall`, { anchor: 'end' });

  // Relief section through s = 0, depth drawn 5 times larger
  const sx = 1440;
  sh.text(sx - 60, 100, 'RELIEF ON s = 0 · depth ×5', { size: 13, anchor: 'start', weight: 600 });
  {
    const topY = rp(0, H)[1];
    const depthPx = band.relief * S * 5;
    const inside = (polys, h) => polys.some((p) => {
      const xs = crossings(p, h);
      for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i] <= 0 && xs[i + 1] >= 0) return true;
      return false;
    });
    const raisedAt = (h) => h > r.groove && h < H - r.groove && !inside(motif.cut, h) && inside(motif.raised, h);
    const pts = [];
    for (let k = 0; k <= 900; k++) pts.push([sx + (raisedAt(H - (k / 900) * H) ? 0 : depthPx), topY + (k / 900) * H * S]);
    sh.poly([[sx + 80, topY], ...pts, [sx + 80, topY + H * S]], ST.section);
    sh.dim([sx + depthPx, topY + H * S + 16], [sx, topY + H * S + 16], 0.1, fmt(band.relief), { ext: false });
    sh.text(sx + 40, topY - 18, 'wood →', { size: 12, fill: COL.note });
  }

  // Height map preview: three repeats
  const hm = view(420, 1200, 250);
  sh.text(90, 945, 'HEIGHT MAP · 1 p = 250 px', { size: 13, anchor: 'start', weight: 600 });
  sh.text(90, 963, 'white = surface, black = cut; band-height-tile.svg is one exact repeat', { size: 12, anchor: 'start', fill: COL.note });
  const hx = hm(-1.5 * P, 0)[0];
  const hy = hm(0, H)[1];
  sh.raw(`<clipPath id="hmClip"><rect x="${n1(hx)}" y="${n1(hy)}" width="${n1(3 * P * 250)}" height="${n1(H * 250)}"/></clipPath>`);
  sh.raw(`<g clip-path="url(#hmClip)"><rect x="${n1(hx)}" y="${n1(hy)}" width="${n1(3 * P * 250)}" height="${n1(H * 250)}" fill="#000"/>`);
  for (const dx of [-2 * P, -P, 0, P, 2 * P]) {
    sh.path(motif.raised.map((p) => pathD(hm.pts(p.map(([s, h]) => [s + dx, h])))).join(''), 'fill="#fff"');
    sh.path(motif.cut.map((p) => pathD(hm.pts(p.map(([s, h]) => [s + dx, h])))).join(''), 'fill="#000"');
  }
  sh.raw('</g>');
  sh.poly(hm.pts([[-1.5 * P, 0], [1.5 * P, 0], [1.5 * P, H], [-1.5 * P, H]]), ST.thin);

  // Where the repeats fall round the board
  const pl = view(1350, 1110, 50, 1, 1);
  sh.text(1000, 945, `LAYOUT ROUND THE SIDE · ${band.repeats} repeats · 1 p = 50 px`, { size: 13, anchor: 'start', weight: 600 });
  sh.path(stadium(pl, body.halfLength, body.halfWidth), ST.visible);
  for (let k = 0; k < band.repeats; k++) {
    const p = pl(...perimPoint(k * P));
    sh.raw(`<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${k === 0 ? 5 : 2.6}" fill="${COL.centre}"/>`);
    const [x, z] = perimPoint(k * P + P / 2);
    const out = Math.abs(x) <= endX ? [0, Math.sign(z)] : [(x - Math.sign(x) * endX) / body.halfWidth, z / body.halfWidth];
    const q = pl(x, z);
    sh.line(q, [q[0] + out[0] * 10, q[1] + out[1] * 10], ST.thin);
  }
  sh.leader(pl(0, body.halfWidth), pl(1.2, 2.5), 'repeat 1: peak at the middle of A\'s side', { anchor: 'start' });
  sh.text(...pl(0, 0), 'plan', { size: 12, fill: COL.note });
  sh.notes(1000, 1270, [
    'Dots: zigzag peaks. Ticks: joins between repeats.',
    `A quarter of the way round is exactly ${band.repeats / 4} repeats, so peaks also sit`,
    'at the middle of B\'s side and at the tip of each end.',
    'Round the ends the band bends with the wood; it is never stretched.',
  ], { size: 12, gap: 18 });

  sh.notes(90, 1270, [
    `On the side: band top ${fmt(-band.bottomY - band.height)} below the top face, bottom ${fmt(body.thickness + band.bottomY)} above the underside.`,
    'Redrawn as clean geometry from image 15: same rhythm and proportions; no religious symbols.',
    'Ease every cut edge by about 0.2 mm.',
    `For 3D: band-height-tile.svg as the bump/normal map, ${band.repeats} tiles round the perimeter.`,
  ], { size: 12.5, gap: 19 });
  sh.titleBlock(3, 'Carved side band', 'Repeat 1 p = 700 px; height map 250 px; layout 50 px');
  return sh;
}

// One exact repeat as a grey height map, in millimetres; tiles seamlessly left to right.
function bandHeightTile() {
  const P = band.repeat * MM;
  const H = band.height * MM;
  const toTile = (poly, dx) => poly.map(([s, h]) => [(s + band.repeat / 2) * MM + dx, (band.height - h) * MM]);
  const shapes = (list, dxs) => list.flatMap((p) => dxs.map((dx) => pathD(toTile(p, dx)))).join('');
  const copies = [-P, 0, P];
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${trim(P, 4)} ${H}" width="1024" height="${Math.round((1024 * H) / P)}">
<!-- Gebeta carved band, one repeat (${trim(P, 3)} x ${H} mm). White = original surface, black = cut ${band.relief * MM} mm deep. -->
<defs>
<filter id="ease" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0.2"/></filter>
<clipPath id="tile"><rect width="${trim(P, 4)}" height="${H}"/></clipPath>
</defs>
<g clip-path="url(#tile)"><g filter="url(#ease)">
<rect x="${trim(-P, 4)}" y="-2" width="${trim(3 * P, 4)}" height="2" fill="#fff"/>
<rect x="${trim(-P, 4)}" y="${H}" width="${trim(3 * P, 4)}" height="2" fill="#fff"/>
<rect x="${trim(-P, 4)}" y="0" width="${trim(3 * P, 4)}" height="${H}" fill="#000"/>
<path d="${shapes(motif.raised, copies)}" fill="#fff"/>
<path d="${shapes(motif.cut, copies)}" fill="#000"/>
</g></g>
</svg>
`;
}

// ---------- output ----------
const r4 = (v) => Math.round(v * 10000) / 10000;
const roundAll = (x) => (Array.isArray(x) ? x.map(roundAll) : typeof x === 'number' ? r4(x) : x && typeof x === 'object'
  ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, roundAll(v)])) : x);
const dims = roundAll({
  units: { length: 'p (game unit)', mmPerUnit: MM, note: '1 p = one cup pitch = 1 unit in apps/web/src/scene/layout.ts' },
  axes: '+x towards player A\'s store (A\'s right), +y up, +z towards player A; origin at the centre of the top face',
  body: { ...body, plan: 'stadium (rounded ends)', endCentreX: endX, perimeter },
  cups: { ...cup, shape: 'spherical cap', holes: cups },
  stores: { ...store, shape: 'spherical cap', list: stores },
  feet: { ...foot, list: feet, note: 'square blocks under the body; every free edge chamfered' },
  heads: {
    ...head,
    list: [{ x: -head.x, facing: '+x', end: 'store B' }, { x: head.x, facing: '-x', end: 'store A' }],
    axes: 'head-local: u forward (to the muzzle), v up from the top face, w sideways; neck axis at u = w = 0',
    measures,
    outlines: {
      side: sideOutline,
      sideHeadOnly: sideHeadOutline,
      frontHeadOnly: frontHeadOutline,
      topHeadOnly,
      frontSilhouette,
      topSilhouette,
      note: 'side: (u, v); front: (w, v); top: (u, w). Build the head without horns from the three head-only outlines (side is the master).',
    },
    horn: {
      length: hornLength,
      stations: hornStations.map(({ t, s, u, v, th, depth, z, width }) => ({ t, s, u, v, z, depth, width, normal: [Math.cos(th), Math.sin(th)] })),
      ridges: { count: ridges.length, list: ridges.map(({ t, height }) => ({ t, height })) },
      note: 'Sweep an oval (depth along normal in the u-v plane, width along w) along (u, v, ±z); ridges sit on the normal (outer) side.',
    },
  },
  band: { ...band, rows: motif.rows, zigzag: motif.zigzag, pyramid: motif.pyramid, triangle: motif.triangle, motif: { raised: motif.raised, cut: motif.cut, note: '(s, h): s along the side, peak at 0, clip to |s| <= repeat/2; h up from the band bottom' }, start: 'peak of repeat 1 at the middle of player A\'s side (x = 0, z = +halfWidth); repeats run towards +x' },
  stones: stone,
  gameLayoutChanges: { HOLE_RADIUS: { now: 0.4, blueprint: cup.diameter / 2 }, HOLE_DEPTH: { now: 0.22, blueprint: cup.depth }, STONE_SIZE: { now: 0.11, blueprint: stone.diameter, note: 'STONE_SIZE is the size across' } },
});

writeFileSync(join(OUT, 'board.svg'), boardSheet().toString());
writeFileSync(join(OUT, 'ibex-head.svg'), headSheet().toString());
writeFileSync(join(OUT, 'band.svg'), bandSheet().toString());
writeFileSync(join(OUT, 'band-height-tile.svg'), bandHeightTile());
writeFileSync(join(OUT, 'board-dimensions.json'), `${JSON.stringify(dims, null, 1)}\n`);

console.log('horn:', rays.length, 'rays,', `${trim((rays[0].th * 180) / Math.PI, 1)}..${trim((rays.at(-1).th * 180) / Math.PI, 1)} deg,`, 'length', trim(hornLength, 3), 'p');
console.log('ridges:', ridges.length, 'heights', ridges.map((r) => trim(r.height * MM, 1)).join(' '), 'mm; gaps', ridges.slice(1).map((r, k) => trim((r.outer - ridges[k].outer) * MM, 1)).join(' '));
console.log('measures:', JSON.stringify(roundAll(measures)));
console.log('front silhouette loops:', frontSilhouette.length, 'top:', topSilhouette.length);
console.log('band repeat', trim(band.repeat, 4), 'p =', trim(band.repeat * MM, 2), 'mm');
