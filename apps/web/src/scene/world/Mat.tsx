import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from '../layout';

/** The mat's plan: an oval 1.1 × 0.65 m. */
export const MAT_RADII = { x: 11, z: 6.5 };
const THICKNESS = 0.04;
/** The fringe stands this far beyond the woven edge, as a share of the mat's radius. */
const FRINGE = 0.055;

/**
 * The woven grass mat the board rests on: natural straw, with the dyed rings a coiled mat has
 * near its rim (a wide madder-red band between two dark lines) and a frayed fringe of loose
 * strands. The rings and the fringe are drawn in the shader from the distance to the centre.
 */
export function Mat() {
  const tex = useTexture({ map: '/textures/mat-color.webp', normalMap: '/textures/mat-normal.webp' });
  useMemo(() => {
    for (const t of Object.values(tex)) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(7, 4.2);
      t.anisotropy = 4;
    }
    tex.map.colorSpace = THREE.SRGBColorSpace;
  }, [tex]);
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ map: tex.map, normalMap: tex.normalMap, color: new THREE.Color(1.18, 1.12, 1.0), roughness: 0.92, alphaTest: 0.5, transparent: false });
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\n  varying vec2 vDisc;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vDisc = position.xy;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n  varying vec2 vDisc;')
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
  float r = length(vDisc);
  float bearing = atan(vDisc.y, vDisc.x);
  // Dyed rings near the rim: a dark line, a wide red band with a pale zigzag, a dark line.
  float red = smoothstep(0.80, 0.81, r) * (1.0 - smoothstep(0.905, 0.915, r));
  float lines = (smoothstep(0.775, 0.782, r) * (1.0 - smoothstep(0.795, 0.802, r))) + (smoothstep(0.92, 0.927, r) * (1.0 - smoothstep(0.94, 0.947, r)));
  float zig = abs(fract(bearing * 22.0 / 6.2831853) - 0.5) * 2.0;
  float pale = red * (1.0 - smoothstep(0.012, 0.02, abs((r - 0.8575) - (zig - 0.5) * 0.05)));
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.72, 0.2, 0.13), red * 0.85);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.22, 0.15, 0.12), clamp(lines, 0.0, 1.0) * 0.9);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.25, 1.2, 1.05), pale);
  // A little darker towards the middle, where the board has stood, and at the very rim.
  diffuseColor.rgb *= 0.9 + 0.1 * smoothstep(0.0, 0.7, r);
  // Beyond the woven edge: loose strands of uneven length.
  if (r > 1.0) {
    float strand = fract(bearing * 240.0 / 6.2831853);
    float lengthOf = 0.45 + 0.55 * fract(sin(floor(bearing * 240.0 / 6.2831853) * 91.7) * 4375.85);
    float inStrand = step(0.28, strand) * step(strand, 0.72);
    diffuseColor.a = inStrand * step(r, 1.0 + ${FRINGE.toFixed(3)} * lengthOf);
    diffuseColor.rgb *= vec3(0.95, 0.88, 0.7);
  }`,
        );
    };
    m.customProgramCacheKey = () => 'mat';
    return m;
  }, [tex]);
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={GROUND_Y + THICKNESS} scale={[MAT_RADII.x, MAT_RADII.z, 1]} material={material} receiveShadow>
      <circleGeometry args={[1 + FRINGE, 96]} />
    </mesh>
  );
}
