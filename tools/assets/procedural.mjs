// Textures made in code, for when an image cannot be generated. Each returns a sharp instance.
import sharp from 'sharp';

/** A seeded number in [0, 1). */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Tileable value noise in [0, 1] with `px` × `py` cells across the picture. */
function noise(width, height, px, py, seed) {
  const r = rng(seed);
  const lattice = Array.from({ length: px * py }, () => r());
  const at = (i, j) => lattice[((j + py) % py) * px + ((i + px) % px)];
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const u = (x / width) * px;
    const v = (y / height) * py;
    const i = Math.floor(u);
    const j = Math.floor(v);
    const fu = smooth(u - i);
    const fv = smooth(v - j);
    const top = at(i, j) * (1 - fu) + at(i + 1, j) * fu;
    const bottom = at(i, j + 1) * (1 - fu) + at(i + 1, j + 1) * fu;
    return top * (1 - fv) + bottom * fv;
  };
}

/** Builds an RGB picture from a per-pixel colour function returning [r, g, b] in 0–255. */
function rgb(width, height, fn) {
  const data = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = fn(x, y);
      const i = (y * width + x) * 3;
      data[i] = Math.max(0, Math.min(255, Math.round(r)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }
  }
  return sharp(data, { raw: { width, height, channels: 3 } });
}

/** Builds an RGBA picture from a per-pixel function returning [r, g, b, a] in 0–255. */
function rgba(width, height, fn) {
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = fn(x, y);
      const i = (y * width + x) * 4;
      data[i] = Math.max(0, Math.min(255, Math.round(r)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
      data[i + 3] = Math.max(0, Math.min(255, Math.round(a)));
    }
  }
  return sharp(data, { raw: { width, height, channels: 4 } });
}

/**
 * A tightly woven grass mat: warp and weft strands crossing over and under each other, in dry
 * straw tones with a slow mottle. Tiles seamlessly (the weave period divides the size).
 */
export function weave(size = 512) {
  const strands = 32;
  const pitch = size / strands;
  const mottle = noise(size, size, 8, 8, 11);
  const fibre = noise(size, size, 64, 64, 5);
  return rgb(size, size, (x, y) => {
    const sx = Math.floor(x / pitch);
    const sy = Math.floor(y / pitch);
    const over = (sx + sy) % 2 === 0;
    const fx = (x % pitch) / pitch;
    const fy = (y % pitch) / pitch;
    const bulge = over ? Math.sin(Math.PI * fy) : Math.sin(Math.PI * fx);
    const along = over ? fx : fy;
    const edge = Math.min(bulge, 1) * (0.75 + 0.25 * Math.sin(Math.PI * along));
    const shade = 0.35 + 0.65 * edge ** 0.8;
    const tone = 0.85 + 0.3 * (mottle(x, y) - 0.5) + 0.12 * (fibre(x, y) - 0.5);
    const v = shade * tone;
    return [205 * v, 168 * v, 104 * v];
  });
}

/** Eucalyptus bark: long vertical streaks of shedding bark in grey-brown and cream. */
export function bark(size = 512) {
  const streak = noise(size, size, 24, 3, 21);
  const detail = noise(size, size, 48, 12, 22);
  const patches = noise(size, size, 4, 6, 23);
  return rgb(size, size, (x, y) => {
    const s = streak(x, y) * 0.6 + detail(x, y) * 0.4;
    const shed = patches(x, y) > 0.6 ? 1 : 0; // pale patches where the bark has peeled
    const v = 0.35 + 0.5 * s;
    const r = shed ? 180 : 110;
    const g = shed ? 165 : 92;
    const b = shed ? 140 : 72;
    return [r * v, g * v, b * v];
  });
}

/** Rough basalt: dark grey with pitted fine grain and a few lighter mineral flecks. */
export function basalt(size = 512) {
  const grain = noise(size, size, 64, 64, 31);
  const pits = noise(size, size, 128, 128, 32);
  const broad = noise(size, size, 6, 6, 33);
  return rgb(size, size, (x, y) => {
    const v = 0.25 + 0.3 * grain(x, y) + 0.15 * broad(x, y) - (pits(x, y) > 0.8 ? 0.15 : 0);
    return [78 * v * 1.9, 74 * v * 1.9, 70 * v * 1.9];
  });
}

/** Dry thatch: overlapping horizontal straw with a slight downward lay. */
export function thatch(size = 512) {
  const strands = noise(size, size, 6, 96, 41);
  const fine = noise(size, size, 16, 192, 42);
  const tone = noise(size, size, 8, 8, 43);
  return rgb(size, size, (x, y) => {
    const s = 0.55 * strands(x, y) + 0.45 * fine(x, y);
    const v = 0.3 + 0.7 * s;
    const t = 0.85 + 0.3 * (tone(x, y) - 0.5);
    return [196 * v * t, 150 * v * t, 84 * v * t];
  });
}

/** Mud-and-straw plaster: a smooth ochre mottle with faint trowel sweeps and straw flecks. */
export function plaster(size = 512) {
  const mottle = noise(size, size, 5, 5, 51);
  const sweeps = noise(size, size, 3, 24, 52);
  const flecks = noise(size, size, 128, 128, 53);
  return rgb(size, size, (x, y) => {
    const v = 0.72 + 0.2 * (mottle(x, y) - 0.5) + 0.08 * (sweeps(x, y) - 0.5) + (flecks(x, y) > 0.9 ? 0.08 : 0);
    return [178 * v, 132 * v, 86 * v];
  });
}

/** A seamless mountain ridge silhouette, in flat layered night tones; the sky is transparent. */
export function ridge(width = 2048, height = 256) {
  const far = noise(width, height, 9, 1, 61);
  const near = noise(width, height, 17, 1, 62);
  const rough = noise(width, height, 64, 1, 63);
  return rgba(width, height, (x, y) => {
    const v = 1 - y / height; // 1 at the top
    const hFar = 0.45 + 0.4 * far(x, 0) + 0.04 * rough(x, 0);
    const hNear = 0.2 + 0.4 * near(x, 0) + 0.05 * rough(x, 10);
    if (v < hNear) return [14, 16, 24, 255];
    if (v < hFar) return [26, 30, 46, 255];
    return [0, 0, 0, 0];
  });
}

/** Four tree silhouettes (two eucalyptus, two acacia) on a transparent 1024 × 512 atlas. */
export function trees(width = 1024, height = 512) {
  const r = rng(71);
  const cell = width / 4;
  // Each tree: a trunk and a cloud of leaf blobs.
  const treesList = [0, 1, 2, 3].map((i) => {
    const acacia = i >= 2;
    const cx = cell * i + cell / 2;
    const blobs = [];
    const n = acacia ? 18 : 26;
    for (let k = 0; k < n; k++) {
      const spread = acacia ? 0.42 : 0.26;
      const top = acacia ? 0.35 : 0.18;
      const rise = acacia ? 0.22 : 0.62;
      blobs.push({
        x: cx + (r() - 0.5) * cell * spread * 2,
        y: height * (top + r() * rise),
        rx: cell * (acacia ? 0.12 + r() * 0.1 : 0.06 + r() * 0.07),
        ry: height * (acacia ? 0.04 + r() * 0.04 : 0.05 + r() * 0.06),
      });
    }
    return { cx, acacia, blobs, trunkW: cell * (acacia ? 0.035 : 0.03), trunkTop: height * (acacia ? 0.42 : 0.3) };
  });
  return rgba(width, height, (x, y) => {
    const i = Math.min(3, Math.floor(x / cell));
    const t = treesList[i];
    let inside = false;
    if (Math.abs(x - t.cx) < t.trunkW * (0.6 + 0.4 * (y / height)) && y > t.trunkTop) inside = true;
    if (!inside) for (const b of t.blobs) if (((x - b.x) / b.rx) ** 2 + ((y - b.y) / b.ry) ** 2 < 1) { inside = true; break; }
    return inside ? [12, 14, 12, 255] : [0, 0, 0, 0];
  });
}

export const procedural = { weave, bark, basalt, thatch, plaster, ridge, trees };
