import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { makeNoiseTexture } from './noise';
import { skyFragmentShader, skyVertexShader } from './skyShader';

export const SKY_RADIUS = 2000;
/** The moon's direction, high behind the far end. */
export const MOON_DIRECTION = new THREE.Vector3(8, 20, -14).normalize();

/** The night sky dome: stars, the moon and its halo, drifting clouds, and the mountain ridge. */
export function Sky() {
  const ridge = useTexture('/textures/ridge-color.webp');
  ridge.wrapS = THREE.RepeatWrapping;
  const noise = useMemo(() => makeNoiseTexture(256, 8), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertexShader,
        fragmentShader: skyFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uMoonDir: { value: MOON_DIRECTION },
          uNoise: { value: noise },
          uRidge: { value: ridge },
        },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [noise, ridge],
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
