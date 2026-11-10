import { mulberry32 } from '@etg/gebeta-rules';
import * as THREE from 'three';

/**
 * Leaf shade, for a yard with trees in it (there are none at present, and `LEAF_SHADE_AMOUNT`
 * below is 0): trees throw moving, dappled shade on the ground around the board. The
 * board itself sits in a sunlit clearing, so the cups and stones are always in plain light; the
 * shade begins beyond the mat and moves as the branches sway.
 *
 * It is a tileable texture of soft leaf clusters, sampled twice in world space by any material
 * that asks for it, so it costs no shadow map and reaches as far as the trees would.
 */

/** A tiling texture of soft blobs: white where a cluster of leaves blocks the sun. */
function makeLeafTexture(): THREE.Texture {
  const size = 512;
  if (typeof document === 'undefined') return new THREE.Texture();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  ctx.filter = 'blur(7px)';
  ctx.fillStyle = '#fff';
  const rng = mulberry32(53);
  for (let i = 0; i < 150; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 12 + rng() * 26;
    const squash = 0.45 + rng() * 0.4;
    const turn = rng() * Math.PI;
    // Drawn nine times over so a blob crossing an edge comes back in on the other side.
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        ctx.beginPath();
        ctx.ellipse(x + dx, y + dy, r, r * squash, turn, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

let shared: { uLeaf: { value: THREE.Texture }; uLeafTime: { value: number } } | null = null;

/** The uniforms every shaded material shares; `uLeafTime` is advanced once a frame by the yard. */
export function leafUniforms() {
  shared ??= { uLeaf: { value: makeLeafTexture() }, uLeafTime: { value: 0 } };
  return shared;
}

/** GLSL: how much leaf shade (0 to 1) falls at a point on the ground, and the cool colour it leaves. */
export const LEAF_SHADE_GLSL = /* glsl */ `
  uniform sampler2D uLeaf;
  uniform float uLeafTime;
  const vec3 LEAF_SHADE_TINT = vec3(0.6, 0.65, 0.78);
  // No trees stand in the yard now, so no shade falls; set to 1.0 when they do.
  const float LEAF_SHADE_AMOUNT = 0.0;
  float leafShade(vec2 p) {
    vec2 sway = vec2(sin(uLeafTime * 0.45), cos(uLeafTime * 0.33)) * 0.4;
    float a = texture2D(uLeaf, (p + sway) / 19.0).r;
    float b = texture2D(uLeaf, (p - sway * 1.7) / 31.0 + vec2(0.37, 0.11)).r;
    float canopy = smoothstep(0.3, 0.72, a * 0.62 + b * 0.5);
    // A sunlit clearing round the board, shade beyond it, and open ground again past the trees' reach.
    float r = length(p * vec2(1.0, 1.4));
    float ring = smoothstep(14.0, 25.0, r) * (1.0 - smoothstep(80.0, 150.0, r));
    return canopy * ring * LEAF_SHADE_AMOUNT;
  }
`;

/**
 * Makes a standard material take the leaf shade, and a slow mottle so a tiled ground texture
 * does not show its repeat. Call before the material is first used.
 */
export function withLeafShade<T extends THREE.MeshStandardMaterial>(material: T, key: string): T {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, leafUniforms());
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n  varying vec2 vShadeAt;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n  vShadeAt = (modelMatrix * vec4(transformed, 1.0)).xz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n  varying vec2 vShadeAt;\n${LEAF_SHADE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
  diffuseColor.rgb *= 0.93 + 0.14 * texture2D(uLeaf, vShadeAt / 310.0).r;
  diffuseColor.rgb *= mix(vec3(1.0), LEAF_SHADE_TINT, leafShade(vShadeAt));`,
      );
  };
  material.customProgramCacheKey = () => `leaf-shade:${key}`;
  return material;
}
