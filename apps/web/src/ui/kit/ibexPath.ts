import { BLUEPRINT } from '../../scene/board/blueprint';

/**
 * The ibex head's side silhouette, horns and all, from the board's blueprint, fitted into a box
 * `fit` units across and centred on (`cx`, `cy`). The interface's crest and its ibex icon are
 * this one outline, so they are the board's own carving and not a drawing of it.
 */
export function ibexPath(fit: number, cx: number, cy: number): string {
  const points = BLUEPRINT.heads.outlines.side;
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  for (const [u, v] of points) {
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    minV = Math.min(minV, v);
    maxV = Math.max(maxV, v);
  }
  const s = fit / Math.max(maxU - minU, maxV - minV);
  const cu = (minU + maxU) / 2;
  const cv = (minV + maxV) / 2;
  const r = (n: number) => Math.round(n * 100) / 100;
  return points.map(([u, v], i) => `${i === 0 ? 'M' : 'L'}${r(cx + (u - cu) * s)} ${r(cy - (v - cv) * s)}`).join('') + 'Z';
}
