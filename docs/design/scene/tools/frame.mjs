// Tries seat cameras for the new board on an 844 x 390 landscape screen. `node frame.mjs try` prints framings that fit.
import { readFileSync } from 'node:fs';

const D = JSON.parse(readFileSync(new URL('../../board/blueprint/board-dimensions.json', import.meta.url), 'utf8'));
const W = 844, H = 390;
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };

export function camera({ elev, fov, dist, target = [0, 0, 0], seat = 1 }) {
  const e = (elev * Math.PI) / 180;
  const pos = [target[0], target[1] + dist * Math.sin(e), target[2] + seat * dist * Math.cos(e)];
  const f = norm(sub(target, pos));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const t = Math.tan((fov * Math.PI) / 360);
  const aspect = W / H;
  return (p) => {
    const d = sub(p, pos);
    const z = dot(d, f);
    return [W / 2 + (dot(d, r) / (z * t * aspect)) * (W / 2), H / 2 - (dot(d, u) / (z * t)) * (H / 2)];
  };
}

const hx = D.heads.x;
const side = D.heads.outlines.side;
const head = (s) => side.map(([u, v]) => [s < 0 ? -hx + u : hx - u, v]);
const pts = [];
for (const s of [-1, 1]) for (const [x, y] of head(s)) for (const z of [-1, 0, 1]) pts.push([x, y, z * (y > 1.2 ? D.heads.measures.hornSpread / 2 : 0.3)]);
for (const x of [-6.05, 6.05]) for (const z of [-1.28, 1.28]) for (const y of [0, -1.8]) pts.push([x, y, z]);

const box = (proj) => {
  const s = pts.map(proj);
  return { x0: Math.min(...s.map((p) => p[0])), x1: Math.max(...s.map((p) => p[0])), y0: Math.min(...s.map((p) => p[1])), y1: Math.max(...s.map((p) => p[1])) };
};
if (process.argv[2] === 'try') {
  for (const elev of [42, 48, 54]) for (const fov of [26, 30, 34]) {
    for (let dist = 10; dist < 60; dist += 0.25) {
      const b = box(camera({ elev, fov, dist, target: [0, 0.4, 0] }));
      if (b.x0 >= 70 && b.x1 <= 774 && b.y0 >= 62 && b.y1 <= 352) {
        console.log({ elev, fov, dist, box: Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v)])) });
        break;
      }
    }
  }
}
