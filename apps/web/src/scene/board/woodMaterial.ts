import * as THREE from 'three';

export interface BoardTextures {
  /** The long grain (reference image 17), drawn with the grain along u. */
  map: THREE.Texture;
  /** The end grain (reference image 18): growth rings about the centre. */
  end: THREE.Texture;
  /** The carved band round the sides: its normals and its height (white raised, black cut). */
  band: THREE.Texture;
  bandHeight: THREE.Texture;
}

/** Board units across one tile of the long-grain photograph: 250 mm of wood. */
export const WOOD_TILE = 5;
/** Board units across the end-grain photograph. */
export const END_TILE = 4.5;

interface WoodOptions {
  /** How much of the end grain shows on the faces across the grain (the board's ends): 0 on the heads. */
  endGrain: number;
  /** Shade a bowl's inside darker with depth: 0 off, 1 on. */
  cupShade: number;
  /** Shade the band's cut parts darker: 0 off, 1 on (the material then needs the band's maps). */
  bandCavity: number;
  /** Which way the grain runs: through the block along its length, up a head and neck, or along a horn (by its uvs). */
  grain: 'block' | 'upright' | 'horn';
}

const GRAIN = { block: 0, upright: 1, horn: 2 } as const;
/** A horn's length and girth in board units, for laying the grain along it at the wood's own scale. */
const HORN_LENGTH = 4.2;
const HORN_GIRTH = 1.3;

const VARYINGS = /* glsl */ `
  varying vec3 vBlockPosition;
  varying vec3 vBlockNormal;
`;

const UNIFORMS = /* glsl */ `
  uniform sampler2D endMap;
  uniform sampler2D bandHeight;
  uniform float woodScale;
  uniform float endScale;
  uniform float endGrain;
  uniform float cupShade;
  uniform float bandCavity;
  uniform float grain;
  uniform vec2 hornScale;
  uniform vec3 woodTint;
  uniform float woodSaturation;
  uniform float grainContrast;
  uniform float woodBump;

  float woodHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // The wood's open pores: short dark dashes lying along the grain, at two sizes. Here g is in board
  // units, x along the grain. Each size fades out before it would be smaller than a pixel.
  float woodPoreLayer(vec2 g, vec2 density) {
    vec2 cell = g * density;
    vec2 id = floor(cell);
    vec2 f = fract(cell);
    float on = step(0.6, woodHash(id));
    float len = 0.3 + 0.6 * woodHash(id + 7.3);
    float along = smoothstep(0.0, 0.1, f.x) * (1.0 - smoothstep(len, len + 0.1, f.x));
    float across = 1.0 - smoothstep(0.22, 0.48, abs(f.y - 0.5));
    float seen = 1.0 - smoothstep(0.35, 0.9, fwidth(cell.y));
    return on * along * across * seen;
  }
  float woodPores(vec2 g) {
    return max(woodPoreLayer(g, vec2(7.0, 130.0)), 0.5 * woodPoreLayer(g + 3.7, vec2(4.0, 64.0)));
  }
`;

/**
 * The wood's colour at a point of the block. The board is carved from one block with the grain
 * running along its length (x), so the photograph of the long grain is laid on the faces that
 * look up, down and sideways, and the end grain on the faces that look along the grain: the
 * rounded ends show their rings, and the lines on the top run on down the sides. No uvs are
 * involved, so the grain is the same size everywhere and has no seams.
 */
const WOOD_FRAGMENT = /* glsl */ `
  vec3 blockWeight = pow(abs(normalize(vBlockNormal)), vec3(8.0));
  blockWeight /= (blockWeight.x + blockWeight.y + blockWeight.z);
  vec3 blockAt = vBlockPosition * woodScale;
  vec3 woodColour;
  float pores;
  // Lines cut into the wood, 0 to 1: the horns' growth lines.
  float incised = 0.0;
  if (grain > 1.5) {
    // A horn: the grain follows its length, mirrored about its front so the seam at the back of the uvs does not show.
    float girth = abs(fract(vMapUv.x) * 2.0 - 1.0); // 1 on the front face, 0 at the back
    woodColour = texture2D(map, vec2(vMapUv.y * hornScale.x, girth * hornScale.y)).rgb;
    pores = woodPores(vec2(vMapUv.y * hornScale.x, girth * hornScale.y) / woodScale);
    // The side faces carry fine lines cut across them, each a different length, and one long
    // line runs the horn's length where the side meets the back.
    float sideFace = smoothstep(0.16, 0.3, girth) * (1.0 - smoothstep(0.62, 0.74, girth));
    float line = vMapUv.y * 96.0;
    float reach = 0.3 + 0.7 * woodHash(vec2(floor(line), 3.0));
    float cut = (1.0 - smoothstep(0.06, 0.2, abs(fract(line) - 0.5))) * step(0.72 - 0.5 * reach, girth) * (1.0 - smoothstep(0.92, 1.0, vMapUv.y));
    float rim = 1.0 - smoothstep(0.012, 0.03, abs(girth - 0.2));
    incised = max(cut * sideFace * (1.0 - smoothstep(0.4, 1.2, fwidth(line))), rim * (1.0 - smoothstep(0.85, 1.0, vMapUv.y)));
  } else if (grain > 0.5) {
    // A head and its neck: the carver stands the grain up, so the lines run up the neck on every side.
    vec3 woodTop = texture2D(map, blockAt.xz + vec2(0.11, 0.43)).rgb;
    vec3 woodSide = texture2D(map, blockAt.yx + vec2(0.31, 0.57)).rgb;
    vec3 woodAcross = texture2D(map, blockAt.yz + vec2(0.73, 0.19)).rgb;
    woodColour = woodTop * blockWeight.y + woodSide * blockWeight.z + woodAcross * blockWeight.x;
    pores = woodPores(vBlockPosition.xz) * blockWeight.y + woodPores(vBlockPosition.yx) * blockWeight.z + woodPores(vBlockPosition.yz) * blockWeight.x;
  } else {
    vec3 woodTop = texture2D(map, blockAt.xz).rgb;
    vec3 woodSide = texture2D(map, blockAt.xy + vec2(0.31, 0.57)).rgb;
    vec3 woodAcross = texture2D(map, blockAt.zy * vec2(0.4, 1.0) + vec2(0.73, 0.19)).rgb;
    vec3 woodEnd = texture2D(endMap, vBlockPosition.zy * endScale + vec2(0.5, 0.95)).rgb;
    woodColour = woodTop * blockWeight.y + woodSide * blockWeight.z + mix(woodAcross, woodEnd, endGrain) * blockWeight.x;
    pores = woodPores(vBlockPosition.xz) * blockWeight.y + woodPores(vBlockPosition.xy) * blockWeight.z + woodPores(vBlockPosition.zy) * blockWeight.x * (1.0 - endGrain);
  }
  // On a small rounded carving the photograph's broad figure reads as contour lines: it is quietened there.
  woodColour = mix(texture2D(map, blockAt.yx, 7.0).rgb, woodColour, grainContrast);
  // The oiled wood's own colour: browner and less orange than the photograph's light.
  woodColour = mix(vec3(dot(woodColour, vec3(0.3, 0.5, 0.2))), woodColour, woodSaturation) * woodTint;
  // What the light catches: paler wood stands a hair proud and cut lines are sunk.
  float woodHeight = dot(woodColour, vec3(0.3333)) * 0.55 - incised * 0.5;
  woodColour *= 1.0 - 0.17 * pores;
  woodColour *= 1.0 - 0.32 * incised;
  if (grain > 0.5 && grain < 1.5) {
    // A head carries its own shade, worked out when it was sculpted: how open each point is to the
    // sky in the small (the cuts of the eye, the mouth, the beard) and in the large (under the jaw).
    woodColour *= mix(0.4, 1.0, smoothstep(0.05, 0.95, vMapUv.x)) * mix(0.72, 1.0, vMapUv.y);
  }
  // A bowl is darker the deeper it goes, where less of the sky reaches.
  float bowlDepth = clamp(-vBlockPosition.y / 0.45, 0.0, 1.0);
  woodColour *= mix(1.0, 0.55, bowlDepth * bowlDepth * cupShade);
  #ifdef USE_NORMALMAP
    // The carving's cut parts hold shade and old oil.
    float carved = texture2D(bandHeight, vNormalMapUv).r;
    woodColour *= mix(1.0, mix(0.4, 1.0, smoothstep(0.05, 0.75, carved)), bandCavity);
  #endif
  diffuseColor.rgb *= woodColour;
`;

/** The fine relief of the grain, the pores and the cut lines, as a turn of the surface normal: no normal map is needed. */
const WOOD_BUMP = /* glsl */ `
  {
    vec3 dpx = dFdx(-vViewPosition);
    vec3 dpy = dFdy(-vViewPosition);
    vec2 dH = clamp(vec2(dFdx(woodHeight), dFdy(woodHeight)), -0.25, 0.25) * woodBump;
    vec3 r1 = cross(dpy, normal);
    vec3 r2 = cross(normal, dpx);
    float det = dot(dpx, r1);
    vec3 grad = sign(det) * (dH.x * r1 + dH.y * r2);
    normal = normalize(abs(det) * normal - grad);
  }
`;

function wanza(tex: BoardTextures, options: WoodOptions, band = false): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    map: tex.map,
    // A hand-rubbed oil finish: satin, with the soft sheen wood has at a grazing angle. Not a varnish.
    roughness: 0.6,
    metalness: 0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.55,
    sheen: 0.35,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color('#b9824e'),
    ...(band ? { normalMap: tex.band, normalScale: new THREE.Vector2(1.25, 1.25) } : {}),
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      endMap: { value: tex.end },
      bandHeight: { value: tex.bandHeight },
      woodScale: { value: 1 / WOOD_TILE },
      endScale: { value: 1 / END_TILE },
      endGrain: { value: options.endGrain },
      cupShade: { value: options.cupShade },
      bandCavity: { value: options.bandCavity },
      grain: { value: GRAIN[options.grain] },
      hornScale: { value: new THREE.Vector2(HORN_LENGTH / WOOD_TILE, HORN_GIRTH / 2 / WOOD_TILE) },
      woodTint: { value: new THREE.Color(0.84, 0.76, 0.68) },
      woodSaturation: { value: 0.82 },
      grainContrast: { value: options.grain === 'block' ? 1 : 0.55 },
      woodBump: { value: options.grain === 'horn' ? 0.012 : 0.009 },
    });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VARYINGS}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n  vBlockPosition = position;\n  vBlockNormal = normal;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${VARYINGS}${UNIFORMS}`)
      .replace('#include <map_fragment>', WOOD_FRAGMENT)
      // The paler wood between the growth lines is a little more open and takes the oil duller; the
      // pores and cut lines are dull; and the rubbing itself is uneven, shinier in some places than others.
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
  float rubbed = texture2D(map, blockAt.xz * 0.21 + blockAt.y * 0.17, 3.0).g;
  roughnessFactor = clamp(roughnessFactor + (dot(woodColour, vec3(0.3333)) - 0.25) * 0.4 + pores * 0.3 + incised * 0.3 + (rubbed - 0.45) * 0.35, 0.32, 1.0);`,
      )
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${WOOD_BUMP}`);
  };
  // One program for all three: they differ in uniforms (and the band's normal map, which three keys itself).
  material.customProgramCacheKey = () => 'wanza-block-3';
  return material;
}

/**
 * The board's three materials, in the body's group order: wood (top, bottom and feet), the sides
 * with the carved band, and the bowls. All are the same block of wanza with a hand-rubbed oil
 * finish. The fourth is the heads', with the grain stood upright, and the fifth the horns', with
 * the grain along their length.
 */
export type WoodMaterials = [THREE.MeshPhysicalMaterial, THREE.MeshPhysicalMaterial, THREE.MeshPhysicalMaterial, THREE.MeshPhysicalMaterial, THREE.MeshPhysicalMaterial];

export function woodMaterial(tex: BoardTextures): WoodMaterials {
  const wood = wanza(tex, { endGrain: 1, cupShade: 0, bandCavity: 0, grain: 'block' });
  const sides = wanza(tex, { endGrain: 1, cupShade: 0, bandCavity: 1, grain: 'block' }, true);
  const bowls = wanza(tex, { endGrain: 0, cupShade: 1, bandCavity: 0, grain: 'block' });
  const heads = wanza(tex, { endGrain: 0, cupShade: 0, bandCavity: 0, grain: 'upright' });
  const horns = wanza(tex, { endGrain: 0, cupShade: 0, bandCavity: 0, grain: 'horn' });
  return [wood, sides, bowls, heads, horns];
}
