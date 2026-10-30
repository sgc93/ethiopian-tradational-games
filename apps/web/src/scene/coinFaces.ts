import * as THREE from 'three';

export type CoinWord = 'አንበሳ' | 'ሰው';

export interface CoinFaceSpec {
  rays: number;
  fontPx: number;
  word: CoinWord;
}

/** What a face carries (spec §9 "Coin"): 24 sun rays round the rim and the word at 44% of the diameter. */
export function coinFaceSpec(word: CoinWord, size = 512): CoinFaceSpec {
  return { rays: 24, fontPx: Math.round(size * 0.44), word };
}

/** The font the faces are lettered in; load it before drawing (`document.fonts.load`). */
export const COIN_FONT = "700 48px 'Noto Serif Ethiopic'";

/**
 * Draws one face: a gold ground, the sun-ray border and the word, plus a normal map derived from
 * a height drawing of the same, so the rays and letters read as raised metal.
 */
export function makeCoinFace(word: CoinWord, size = 512): { map: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
  const { rays, fontPx } = coinFaceSpec(word, size);
  const c = size / 2;
  const r = size / 2;

  const colour = document.createElement('canvas');
  colour.width = colour.height = size;
  const height = document.createElement('canvas');
  height.width = height.height = size;
  const ctx = colour.getContext('2d')!;
  const hct = height.getContext('2d')!;

  // Ground: old gold, lighter towards the upper left where the firelight catches it.
  const ground = ctx.createRadialGradient(c * 0.8, c * 0.7, r * 0.1, c, c, r);
  ground.addColorStop(0, '#f1d48a');
  ground.addColorStop(0.55, '#d6ae6a');
  ground.addColorStop(1, '#9a6f2e');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, size, size);
  hct.fillStyle = '#808080';
  hct.fillRect(0, 0, size, size);

  // The sun-ray border: alternating wedges between 78% and 95% of the radius.
  const inner = r * 0.78;
  const outer = r * 0.95;
  for (let i = 0; i < rays; i++) {
    const a0 = (i / rays) * Math.PI * 2;
    const a1 = ((i + 0.5) / rays) * Math.PI * 2;
    const wedge = (g: CanvasRenderingContext2D) => {
      g.beginPath();
      g.moveTo(c + inner * Math.cos(a0), c + inner * Math.sin(a0));
      g.lineTo(c + outer * Math.cos((a0 + a1) / 2), c + outer * Math.sin((a0 + a1) / 2));
      g.lineTo(c + inner * Math.cos(a1), c + inner * Math.sin(a1));
      g.closePath();
      g.fill();
    };
    ctx.fillStyle = 'rgba(120, 80, 20, 0.55)';
    wedge(ctx);
    hct.fillStyle = '#b8b8b8';
    wedge(hct);
  }
  // Two fine rings framing the rays.
  for (const [radius, width] of [
    [inner, 3],
    [outer, 4],
  ] as const) {
    ctx.beginPath();
    ctx.arc(c, c, radius, 0, Math.PI * 2);
    ctx.lineWidth = width;
    ctx.strokeStyle = 'rgba(90, 58, 16, 0.7)';
    ctx.stroke();
    hct.beginPath();
    hct.arc(c, c, radius, 0, Math.PI * 2);
    hct.lineWidth = width;
    hct.strokeStyle = '#c8c8c8';
    hct.stroke();
  }

  // The word, raised: dark gold in colour, bright in height.
  const font = `700 ${fontPx}px 'Noto Serif Ethiopic', serif`;
  for (const [g, fill] of [
    [ctx, '#5a3a10'],
    [hct, '#ffffff'],
  ] as const) {
    g.font = font;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = fill;
    g.fillText(word, c, c + fontPx * 0.04);
  }
  ctx.font = font;
  ctx.fillStyle = 'rgba(255, 240, 200, 0.45)';
  ctx.fillText(word, c - 2, c + fontPx * 0.04 - 2); // a light catch on the letters' upper left

  const map = new THREE.CanvasTexture(colour);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  return { map, normal: normalFromHeight(height) };
}

/** A tangent-space normal map from a grey height drawing (Sobel on luminance). */
function normalFromHeight(height: HTMLCanvasElement, strength = 2.5): THREE.CanvasTexture {
  const size = height.width;
  const src = height.getContext('2d')!.getImageData(0, 0, size, size).data;
  const out = document.createElement('canvas');
  out.width = out.height = size;
  const octx = out.getContext('2d')!;
  const img = octx.createImageData(size, size);
  const h = (x: number, y: number) => src[((Math.max(0, Math.min(size - 1, y)) * size + Math.max(0, Math.min(size - 1, x))) << 2)]! / 255;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x - 1, y) - h(x - 1, y + 1)) * strength;
      const dy = (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x, y - 1) - h(x + 1, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) << 2;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / len) * 255;
      img.data[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(out);
}
