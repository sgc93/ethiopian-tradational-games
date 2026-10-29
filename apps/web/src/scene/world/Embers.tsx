import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { useScene } from '../sceneStore';
import { TIERS } from '../tiers';
import { embersState } from './embersState';

const vertexShader = /* glsl */ `
  attribute float aLife;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uDpr;
  varying float vAge;
  void main() {
    float age = mod(uTime / aLife + aPhase, 1.0);
    vAge = age;
    float t = age * aLife;
    vec3 p = position;
    p.y += aSpeed * t;
    p.x += 0.9 * t + sin(t * 2.3 + aPhase * 6.28) * 0.6;
    p.z += cos(t * 1.7 + aPhase * 6.28) * 0.6;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uDpr * (1.0 - age * 0.5) * (60.0 / -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uYoung;
  uniform vec3 uOld;
  varying float vAge;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = (1.0 - smoothstep(0.6, 1.0, d)) * (1.0 - smoothstep(0.7, 1.0, vAge));
    gl_FragColor = vec4(mix(uYoung, uOld, vAge), a);
  }
`;

/** Glowing embers rising from the fire on a light breeze towards +x, drawn as GPU points. */
export function Embers() {
  const tier = useScene((s) => s.tier);
  const count = TIERS[tier].embers;
  const geometry = useMemo(() => {
    const s = embersState(count, 5);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(s.origin, 3));
    g.setAttribute('aLife', new THREE.BufferAttribute(s.life, 1));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(s.speed, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(s.size, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(s.phase, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-20, 15, -2), 45);
    return g;
  }, [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uDpr: { value: 1 },
          uYoung: { value: new THREE.Color('#ffb060').multiplyScalar(2) },
          uOld: { value: new THREE.Color('#ff5a1a') },
        },
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
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
