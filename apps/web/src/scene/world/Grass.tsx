import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from '../layout';
import { useScene } from '../sceneStore';
import { TIERS } from '../tiers';
import { buildGrass } from './grassGeometry';

const vertexShader = /* glsl */ `
  attribute vec4 aOffset;
  uniform float uTime;
  uniform float uGround;
  varying float vT;
  #include <fog_pars_vertex>
  void main() {
    vT = uv.y;
    float yaw = aOffset.z;
    vec3 p = vec3(position.x, position.y * aOffset.w, position.z);
    float c = cos(yaw), s = sin(yaw);
    vec3 r = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
    float sway = sin(uTime * 1.3 + aOffset.x * 0.4 + aOffset.y * 0.6) * 0.18 * vT * vT;
    r.x += sway;
    r.z += sway * 0.5;
    vec4 worldPosition = vec4(vec3(aOffset.x, uGround, aOffset.y) + r, 1.0);
    vec4 mvPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uTip;
  varying float vT;
  #include <fog_pars_fragment>
  void main() {
    gl_FragColor = vec4(mix(uBase, uTip, vT), 1.0);
    #include <fog_fragment>
  }
`;

/** Short blades around the mat and on the nearby ground, swaying in a vertex-shader wind. */
export function Grass() {
  const tier = useScene((s) => s.tier);
  const count = TIERS[tier].grass;
  const geometry = useMemo(() => (count > 0 ? buildGrass(count, 7) : null), [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uTime: { value: 0 },
            uGround: { value: GROUND_Y },
            uBase: { value: new THREE.Color('#2a2a12') },
            uTip: { value: new THREE.Color('#7a6a30') },
          },
        ]),
        fog: true,
        side: THREE.DoubleSide,
      }),
    [],
  );
  useFrame(({ clock }) => {
    material.uniforms.uTime!.value = clock.elapsedTime;
  });
  if (!geometry) return null;
  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}
