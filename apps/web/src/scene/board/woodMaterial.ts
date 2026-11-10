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
  if (grain > 1.5) {
    // A horn: the grain follows its length, mirrored about its front so the seam at the back of the uvs does not show.
    woodColour = texture2D(map, vec2(vMapUv.y * hornScale.x, abs(fract(vMapUv.x) * 2.0 - 1.0) * hornScale.y)).rgb;
  } else if (grain > 0.5) {
    // A head and its neck: the carver stands the grain up, so the lines run up the neck on every side.
    vec3 woodTop = texture2D(map, blockAt.xz + vec2(0.11, 0.43)).rgb;
    vec3 woodSide = texture2D(map, blockAt.yx + vec2(0.31, 0.57)).rgb;
    vec3 woodAcross = texture2D(map, blockAt.yz + vec2(0.73, 0.19)).rgb;
    woodColour = woodTop * blockWeight.y + woodSide * blockWeight.z + woodAcross * blockWeight.x;
  } else {
    vec3 woodTop = texture2D(map, blockAt.xz).rgb;
    vec3 woodSide = texture2D(map, blockAt.xy + vec2(0.31, 0.57)).rgb;
    vec3 woodAcross = texture2D(map, blockAt.zy * vec2(0.4, 1.0) + vec2(0.73, 0.19)).rgb;
    vec3 woodEnd = texture2D(endMap, vBlockPosition.zy * endScale + vec2(0.5, 0.95)).rgb;
    woodColour = woodTop * blockWeight.y + woodSide * blockWeight.z + mix(woodAcross, woodEnd, endGrain) * blockWeight.x;
  }
  // A bowl is darker the deeper it goes, where less of the sky reaches.
  float bowlDepth = clamp(-vBlockPosition.y / 0.45, 0.0, 1.0);
  woodColour *= mix(1.0, 0.6, bowlDepth * bowlDepth * cupShade);
  #ifdef USE_NORMALMAP
    // The carving's cut parts hold shade and old oil.
    float carved = texture2D(bandHeight, vNormalMapUv).r;
    woodColour *= mix(1.0, mix(0.48, 1.0, smoothstep(0.05, 0.75, carved)), bandCavity);
  #endif
  diffuseColor.rgb *= woodColour;
`;

function wanza(tex: BoardTextures, options: WoodOptions, band = false): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    map: tex.map,
    roughness: 0.52,
    metalness: 0,
    clearcoat: 0.28,
    clearcoatRoughness: 0.42,
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
    });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VARYINGS}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n  vBlockPosition = position;\n  vBlockNormal = normal;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${VARYINGS}${UNIFORMS}`)
      .replace('#include <map_fragment>', WOOD_FRAGMENT)
      // The paler wood between the growth lines is a little more open and takes the oil duller.
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>\n  roughnessFactor = clamp(roughnessFactor + (dot(woodColour, vec3(0.3333)) - 0.3) * 0.5, 0.25, 1.0);`,
      );
  };
  // One program for all three: they differ in uniforms (and the band's normal map, which three keys itself).
  material.customProgramCacheKey = () => 'wanza-block';
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
