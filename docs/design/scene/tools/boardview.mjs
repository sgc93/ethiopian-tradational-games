// Draws the blueprint board through the planned seat camera as an 844 x 390 SVG, plus where each cup's count disc goes.
// Usage: node boardview.mjs <out-dir>   (writes view-seat.svg, view-top.svg, view-top-owners.svg; prints count-disc positions)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { camera } from './frame.mjs';

const D = JSON.parse(readFileSync(new URL('../../board/blueprint/board-dimensions.json', import.meta.url), 'utf8'));
const out = process.argv[2];
const W = 844, H = 390;
const n1 = (v) => Math.round(v * 10) / 10;
const path = (pts, close = true) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${n1(x)} ${n1(y)}`).join('') + (close ? 'Z' : '');
const B = D.body;
const ex = B.endCentreX;
const W2 = B.halfWidth;
const GROUND = -B.thickness - D.feet.height;

// Stadium outline at height y, n points per end.
function stadium(y, inset = 0, n = 24) {
  const r = W2 - inset;
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (Math.PI * i) / n; pts.push([ex + r * Math.cos(a), y, r * Math.sin(a)]); }
  for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + (Math.PI * i) / n; pts.push([-ex + r * Math.cos(a), y, r * Math.sin(a)]); }
  return pts;
}
const circle = (cx, cz, r, y = 0, n = 32) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((2 * Math.PI * i) / n), y, cz + r * Math.sin((2 * Math.PI * i) / n)]);

function draw(view, { counts, label, owners, topDown = false }) {
  const P = (p) => view(p);
  const S = (pts) => pts.map(P);
  const parts = [];
  // night sky and ground, firelight from the left end, hut glow from the right
  parts.push(`<rect width="${W}" height="${H}" fill="url(#ground)"/>`);
  const fire = P([-26, GROUND + 5, -2]);
  const hut = P([90, GROUND + 14, 0]);
  parts.push(`<circle cx="${n1(fire[0])}" cy="${n1(fire[1])}" r="430" fill="url(#firelight)"/>`);
  parts.push(`<circle cx="${n1(hut[0])}" cy="${n1(hut[1])}" r="200" fill="url(#hutlight)"/>`);
  // woven mat on the ground
  const mat = Array.from({ length: 64 }, (_, i) => { const a = (2 * Math.PI * i) / 64; return [11 * Math.cos(a), GROUND, 6.5 * Math.sin(a)]; });
  parts.push(`<path d="${path(S(mat))}" fill="url(#weave)" stroke="rgba(214,180,110,.35)" stroke-width="1"/>`);
  // shadow of the board, thrown away from the fire (towards +x)
  const shadow = stadium(GROUND, -0.2).map(([x, y, z]) => [x + 1.4, y, z * 1.1 - 0.3]);
  parts.push(`<path d="${path(S(shadow))}" fill="rgba(0,0,0,.55)" filter="url(#soft)"/>`);
  // feet (front two visible)
  for (const fx of [-D.feet.x, D.feet.x]) {
    const h = D.feet.size / 2, z = D.feet.z;
    const quad = [[fx - h, -B.thickness, z + h], [fx + h, -B.thickness, z + h], [fx + h, GROUND, z + h], [fx - h, GROUND, z + h]];
    parts.push(`<path d="${path(S(quad))}" fill="#2a170c"/>`);
  }
  // side wall: front half of the stadium, from top edge down to the bottom edge
  const topRing = stadium(0);
  const botRing = stadium(-B.thickness);
  const front = (ring) => ring.filter(([, , z]) => z >= -0.02);
  const ft = front(topRing).sort((a, b) => P(a)[0] - P(b)[0]);
  const fb = front(botRing).sort((a, b) => P(a)[0] - P(b)[0]);
  parts.push(`<path d="${path([...S(ft), ...S(fb).reverse()])}" fill="url(#side)"/>`);
  // carved band lines on the side
  for (const y of [D.band.bottomY, D.band.bottomY + D.band.height]) {
    const line = front(stadium(y)).sort((a, b) => P(a)[0] - P(b)[0]);
    parts.push(`<path d="${path(S(line), false)}" stroke="rgba(255,210,150,.22)" stroke-width="1" fill="none"/>`);
  }
  // zigzag hint between the band lines
  const zz = [];
  for (let x = -ex; x <= ex; x += D.band.repeat / 2) {
    const up = Math.round((x + ex) / (D.band.repeat / 2)) % 2 === 0;
    zz.push([x, D.band.bottomY + (up ? 0.67 : 0.23), W2]);
  }
  parts.push(`<path d="${path(S(zz), false)}" stroke="rgba(255,205,140,.18)" stroke-width="1.2" fill="none"/>`);
  // top face
  parts.push(`<path d="${path(S(topRing))}" fill="url(#top)" stroke="rgba(255,214,160,.35)" stroke-width="1"/>`);
  // cups and stores
  const cupPts = D.cups.holes.map((c) => ({ ...c, r: D.cups.diameter / 2, depth: D.cups.depth }));
  const storePts = D.stores.list.map((s) => ({ ...s, r: D.stores.diameter / 2, depth: D.stores.depth }));
  const stones = [];
  [...cupPts, ...storePts].forEach((c, idx) => {
    const rim = owners && idx < 12 ? (owners[idx] === 0 ? '#e9c27a' : '#b9cfee') : 'rgba(255,214,160,.28)';
    parts.push(`<path d="${path(S(circle(c.x, c.z, c.r)))}" fill="url(#cup)" stroke="${rim}" stroke-width="${owners && idx < 12 ? 2.6 : 1}"/>`);
    const n = counts[idx] ?? 0;
    for (let k = 0; k < Math.min(n, 14); k++) {
      const a = k * 2.399 + idx;
      const rr = c.r * 0.55 * Math.sqrt((k + 0.5) / Math.max(n, 1));
      const p = P([c.x + rr * Math.cos(a), -c.depth * 0.45 + 0.06 * Math.floor(k / 7), c.z + rr * Math.sin(a) * 0.9]);
      const tones = ['#b9ad9a', '#8d7a66', '#d8cdb8', '#6f655b', '#a48d6e'];
      stones.push(`<ellipse cx="${n1(p[0])}" cy="${n1(p[1])}" rx="4.6" ry="3.2" fill="${tones[(k + idx) % tones.length]}" stroke="rgba(0,0,0,.45)" stroke-width=".6"/>`);
    }
  });
  parts.push(stones.join(''));
  // ibex heads as silhouettes on their mid-plane, rim-lit from the fire side
  const side = D.heads.outlines.side;
  if (topDown) for (const s of [-1, 1]) {
    const pts = D.heads.outlines.topSilhouette[0].map(([u, w]) => [s < 0 ? -D.heads.x + u : D.heads.x - u, 1.2, s < 0 ? w : -w]);
    parts.push(`<path d="${path(S(pts))}" fill="url(#head)" stroke="rgba(255,190,120,.45)" stroke-width="1.1"/>`);
  }
  if (!topDown) for (const s of [-1, 1]) {
    const pts = side.map(([u, v]) => [s < 0 ? -D.heads.x + u : D.heads.x - u, v, 0]);
    parts.push(`<path d="${path(S(pts))}" fill="url(#head)" stroke="rgba(255,190,120,${s < 0 ? 0.55 : 0.25})" stroke-width="1.1"/>`);
  }
  // count disc anchors: near row just outside its cups, far row just beyond, stores over their far rim
  const anchor = (c, idx) => {
    if (idx >= 12) return P([c.x, 0, -0.45]);
    return P([c.x, 0, c.z > 0 ? c.z + 0.6 : c.z - 0.6]);
  };
  const discs = [...cupPts, ...storePts].map((c, i) => [...anchor(c, i).map(n1), ...P([c.x, -0.1, c.z]).map(n1)]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0806"/><stop offset=".3" stop-color="#1d120b"/><stop offset="1" stop-color="#2a170d"/></linearGradient>
<radialGradient id="firelight"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".55"/><stop offset=".35" stop-color="#d9661f" stop-opacity=".18"/><stop offset="1" stop-color="#d9661f" stop-opacity="0"/></radialGradient>
<radialGradient id="hutlight"><stop offset="0" stop-color="#ffb35c" stop-opacity=".22"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
<pattern id="weave" width="7" height="5" patternUnits="userSpaceOnUse"><rect width="7" height="5" fill="#4a3518"/><path d="M0 2.5h7M3.5 0v5" stroke="#6b4f26" stroke-width="1.6"/></pattern>
<linearGradient id="side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a2f14"/><stop offset=".5" stop-color="#3a1d0c"/><stop offset="1" stop-color="#26130a"/></linearGradient>
<linearGradient id="top" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a5a2c"/><stop offset=".45" stop-color="#6e3b1a"/><stop offset="1" stop-color="#4a2611"/></linearGradient>
<radialGradient id="cup" cx="45%" cy="35%"><stop offset="0" stop-color="#1c0d05"/><stop offset=".7" stop-color="#3a1d0c"/><stop offset="1" stop-color="#6e3b1a"/></radialGradient>
<linearGradient id="head" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a4520"/><stop offset="1" stop-color="#2a150a"/></linearGradient>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="blur1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter>
</defs>
${parts.join('\n')}
</svg>`;
  writeFileSync(join(out, `${label}.svg`), svg);
  return discs;
}

const counts = [4, 5, 1, 6, 2, 4, 3, 4, 0, 7, 4, 2, 8, 12];
const seat = camera({ elev: 48, fov: 30, dist: 16.25, target: [0, 0.4, 0] });
const discs = draw(seat, { counts, label: 'view-seat' });
const top = camera({ elev: 84, fov: 30, dist: 15.5, target: [0, 0, 0.05] });
draw(top, { counts: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0], label: 'view-top', topDown: true });
draw(top, { counts: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0], label: 'view-top-owners', topDown: true, owners: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0] });
writeFileSync(join(out, 'discs.json'), JSON.stringify(discs));
console.log(JSON.stringify(discs));
