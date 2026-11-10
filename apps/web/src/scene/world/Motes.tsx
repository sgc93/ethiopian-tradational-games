import { mulberry32 } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';

const vertexShader = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uDpr;
  varying float vTwinkle;
  void main() {
    vec3 p = position;
    // Each mote wanders on its own slow loop and sinks, wrapping back to the top of its column.
    p.x += sin(uTime * (0.11 + aSeed.x * 0.12) + aSeed.y * 6.28) * 1.4;
    p.z += cos(uTime * (0.09 + aSeed.y * 0.1) + aSeed.z * 6.28) * 1.1;
    p.y = 0.4 + mod(p.y - uTime * (0.05 + aSeed.z * 0.07), 8.0);
    vTwinkle = 0.55 + 0.45 * sin(uTime * (0.7 + aSeed.w * 1.3) + aSeed.x * 6.28);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.0 + aSeed.w * 1.6) * uDpr * (20.0 / -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = (1.0 - smoothstep(0.2, 1.0, d)) * 0.32 * vTwinkle;
    gl_FragColor = vec4(vec3(1.0, 0.95, 0.82) * 1.5, a);
  }
`;

/** Dust in the sunlight: a few dozen bright motes drifting slowly in the air over the mat. */
export function Motes({ count = 70 }: { count?: number }) {
  const geometry = useMemo(() => {
    const rng = mulberry32(88);
    const position = new Float32Array(count * 3);
    const seed = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      position.set([(rng() - 0.5) * 34, rng() * 8, (rng() - 0.5) * 24], i * 3);
      seed.set([rng(), rng(), rng(), rng()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(position, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 4, 0), 24);
    return g;
  }, [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { uTime: { value: 0 }, uDpr: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useFrame(({ clock, viewport }) => {
    material.uniforms.uTime!.value = clock.elapsedTime;
    material.uniforms.uDpr!.value = viewport.dpr;
  });
  if (count <= 0) return null;
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
