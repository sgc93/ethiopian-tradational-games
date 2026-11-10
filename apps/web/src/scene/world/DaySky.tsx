import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { daySkyFragmentShader, daySkyVertexShader } from './daySkyShader';
import { makeNoiseTexture } from './noise';

export const SKY_RADIUS = 1900;
/** The colour of the air at the horizon; the scene's fog is the same colour, so the ground runs into it. */
export const HAZE = '#d3dfe2';

/** The daytime sky dome: gradient, sun glow, drifting cloud and the mountain ridges on the horizon. */
export function DaySky({ sun }: { sun: THREE.Vector3 }) {
  const noise = useMemo(() => makeNoiseTexture(256, 8), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: daySkyVertexShader,
        fragmentShader: daySkyFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uSunDir: { value: sun.clone().normalize() },
          uHaze: { value: new THREE.Color(HAZE) },
          uNoise: { value: noise },
        },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [noise, sun],
  );
  useFrame(({ clock }) => {
    material.uniforms.uTime!.value = clock.elapsedTime;
  });
  return (
    <mesh material={material} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[SKY_RADIUS, 48, 24]} />
    </mesh>
  );
}
