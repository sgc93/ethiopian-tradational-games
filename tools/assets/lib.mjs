// Texture processing steps shared by process.mjs: seamless tiling, grading, normal and roughness maps.
import sharp from 'sharp';

/**
 * Makes an image tile seamlessly. The result is the image offset by half its size, so the old
 * edges (which now wrap perfectly) meet as seams along the centre lines. Each seam is hidden by
 * cross-fading, over a band of width `blend` (a fraction of the size), towards a copy offset in the
 * other axis only, which is continuous across that seam; where the two bands cross, towards the
 * original. Every copy used at the picture's edges wraps, so the edges match.
 */
export async function makeSeamless(image, blend = 0.12) {
  const { data, info } = await image.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const out = Buffer.alloc(data.length);
  const bx = Math.max(1, Math.round(w * blend));
  const by = Math.max(1, Math.round(h * blend));
  const px = (x, y) => ((y + h) % h) * w * c + ((x + w) % w) * c;
  const smooth = (t) => t * t * (3 - 2 * t);
  const hx = Math.floor(w / 2);
  const hy = Math.floor(h / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const both = px(x + hx, y + hy); // offset in both axes: the base
      const onlyY = px(x, y + hy); // continuous across the vertical seam (x = w/2)
      const onlyX = px(x + hx, y); // continuous across the horizontal seam (y = h/2)
      const none = px(x, y); // continuous across both
      const dx = Math.abs(x - hx);
      const dy = Math.abs(y - hy);
      const tx = dx < bx ? smooth(1 - dx / bx) : 0;
      const ty = dy < by ? smooth(1 - dy / by) : 0;
      const o = px(x, y);
      for (let k = 0; k < c; k++) {
        out[o + k] = Math.round(
          (1 - tx) * (1 - ty) * data[both + k] + tx * (1 - ty) * data[onlyY + k] + (1 - tx) * ty * data[onlyX + k] + tx * ty * data[none + k],
        );
      }
    }
  }
  return sharp(out, { raw: { width: w, height: h, channels: c } });
}

/** Lifts an image's tone to the scene's palette: gamma, a colour tint and a saturation change. */
export function grade(image, { gamma = 1, tint = [1, 1, 1], saturation = 1 } = {}) {
  let out = image.clone();
  if (gamma !== 1) out = out.gamma(Math.max(1, gamma));
  if (saturation !== 1) out = out.modulate({ saturation });
  if (tint.some((v) => v !== 1)) out = out.linear(tint, [0, 0, 0]);
  return out;
}

/**
 * A tangent-space normal map from a grey height buffer (one byte per pixel), by Sobel slopes.
 * The result is RGB bytes; a flat height gives (128, 128, 255).
 */
export function heightToNormal({ data, width: w, height: h }, strength = 2) {
  const out = Buffer.alloc(w * h * 3);
  const at = (x, y) => data[((y + h) % h) * w + ((x + w) % w)] / 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx =
        at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
      const gy =
        at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
      let nx = -gx * strength;
      let ny = gy * strength;
      let nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l;
      ny /= l;
      nz /= l;
      const i = (y * w + x) * 3;
      out[i] = Math.round(nx * 127.5 + 127.5);
      out[i + 1] = Math.round(ny * 127.5 + 127.5);
      out[i + 2] = Math.round(nz * 127.5 + 127.5);
    }
  }
  return out;
}

/** A grey roughness map: `base + range · height`, as bytes. */
export function roughnessFromHeight({ data, width: w, height: h }, { base = 0.5, range = 0.2 } = {}) {
  const out = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) out[i] = Math.round(Math.min(1, Math.max(0, base + (range * data[i]) / 255)) * 255);
  return out;
}

/** The grey height of an image: its luminance, resized to `size`. */
export async function heightOf(image, size) {
  const [w, h] = Array.isArray(size) ? size : [size, size];
  const { data } = await image.clone().resize(w, h, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  return { data, width: w, height: h };
}
