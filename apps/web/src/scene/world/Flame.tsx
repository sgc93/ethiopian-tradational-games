import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FLAME_BASE } from './embersState';
import { flameFragmentShader, flameVertexShader } from './flameShader';
import { flicker } from './flicker';
import { makeNoiseTexture } from './noise';

const HEIGHT = 11;
const WIDTH = 5.5;

/** A soft radial glow for the sprite behind the flames. */
function makeGlow(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 170, 80, 1)');
  g.addColorStop(0.4, 'rgba(255, 130, 50, 0.35)');
  g.addColorStop(1, 'rgba(255, 110, 40, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Three crossed billboards of scrolling-noise flame, 40–60 cm tall, with a glow sprite behind. */
export function Flame() {
  const noise = useMemo(() => makeNoiseTexture(256, 3), []);
  const glow = useMemo(makeGlow, []);
  const materials = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.ShaderMaterial({
            vertexShader: flameVertexShader,
            fragmentShader: flameFragmentShader,
            uniforms: {
              uNoise: { value: noise },
              uTime: { value: 0 },
              uFlicker: { value: 1 },
              uBase: { value: new THREE.Color('#ffe9b0').multiplyScalar(2.2) },
              uMid: { value: new THREE.Color('#ff9a3c').multiplyScalar(1.8) },
              uTip: { value: new THREE.Color('#d9661f').multiplyScalar(0.9) },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
          }),
      ),
    [noise],
  );
  const sprite = useRef<THREE.SpriteMaterial>(null);
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const f = flicker(t);
    materials.forEach((m, i) => {
      m.uniforms.uTime!.value = t * (1 + i * 0.07);
      m.uniforms.uFlicker!.value = 0.7 + 0.3 * f;
    });
    if (sprite.current) sprite.current.opacity = 0.35 * f;
    if (group.current) group.current.scale.y = 0.85 + 0.25 * f;
  });

  return (
    <group position={FLAME_BASE}>
      <group ref={group}>
        {materials.map((m, i) => (
          <mesh key={i} material={m} rotation-y={(i * Math.PI) / 3} position-y={HEIGHT / 2}>
            <planeGeometry args={[WIDTH, HEIGHT]} />
          </mesh>
        ))}
      </group>
      <sprite position-y={3} scale={[24, 24, 1]}>
        <spriteMaterial ref={sprite} map={glow} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}
