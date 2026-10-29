import { mulberry32 } from '@etg/gebeta-rules';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from '../layout';
import { flicker } from './flicker';

/** The hearth's centre on the ground. */
export const HEARTH: [number, number, number] = [-26, GROUND_Y, -2];
const RING_RADIUS = 7;
const STONES = 9;
const LOGS = 6;

/** Nine rough stones in a ring, six crossed logs with charred glowing ends, and a bed of embers. */
export function Hearth() {
  const bed = useRef<THREE.MeshStandardMaterial>(null);
  const ends = useRef<THREE.MeshStandardMaterial>(null);
  const basalt = useTexture({ map: '/textures/basalt-color.webp', normalMap: '/textures/basalt-normal.webp' });
  const bark = useTexture('/textures/bark-color.webp');
  useMemo(() => {
    basalt.map.colorSpace = THREE.SRGBColorSpace;
    bark.colorSpace = THREE.SRGBColorSpace;
    bark.wrapS = bark.wrapT = THREE.RepeatWrapping;
    bark.repeat.set(2, 4);
  }, [basalt, bark]);

  const stones = useMemo(() => {
    const rng = mulberry32(31);
    const geometry = new THREE.DodecahedronGeometry(1, 1);
    const pos = geometry.getAttribute('position');
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).multiplyScalar(0.85 + 0.3 * rng());
      pos.setXYZ(i, v.x, v.y * 0.7, v.z);
    }
    geometry.computeVertexNormals();
    return Array.from({ length: STONES }, (_, i) => {
      const a = (i / STONES) * Math.PI * 2 + rng() * 0.3;
      const s = 1.5 + rng() * 0.5; // stones 15–20 cm across
      return {
        geometry,
        position: [HEARTH[0] + RING_RADIUS * Math.cos(a), HEARTH[1] + s * 0.5, HEARTH[2] + RING_RADIUS * Math.sin(a)] as [number, number, number],
        rotation: [rng() * 0.4, rng() * Math.PI, rng() * 0.4] as [number, number, number],
        scale: s,
      };
    });
  }, []);

  const logs = useMemo(() => {
    const rng = mulberry32(32);
    return Array.from({ length: LOGS }, (_, i) => {
      const a = (i / LOGS) * Math.PI + rng() * 0.4;
      const length = 10 + rng() * 4;
      const tilt = 0.25 + rng() * 0.2;
      return {
        length,
        position: [HEARTH[0] + Math.cos(a) * 2, HEARTH[1] + 1 + Math.sin(tilt) * length * 0.25, HEARTH[2] + Math.sin(a) * 2] as [number, number, number],
        rotation: [0, -a, Math.PI / 2 - tilt] as [number, number, number],
      };
    });
  }, []);

  useFrame(({ clock }) => {
    const f = flicker(clock.elapsedTime);
    if (bed.current) bed.current.emissiveIntensity = 2.5 * f;
    if (ends.current) ends.current.emissiveIntensity = 1.6 * f;
  });

  return (
    <group>
      {stones.map((s, i) => (
        <mesh key={i} geometry={s.geometry} position={s.position} rotation={s.rotation} scale={s.scale} castShadow receiveShadow>
          <meshStandardMaterial map={basalt.map} normalMap={basalt.normalMap} roughness={0.95} />
        </mesh>
      ))}
      {logs.map((l, i) => (
        <group key={i} position={l.position} rotation={l.rotation}>
          <mesh castShadow>
            <cylinderGeometry args={[0.55, 0.65, l.length, 10]} />
            <meshStandardMaterial map={bark} roughness={0.9} />
          </mesh>
          <mesh position-y={-l.length / 2 + 1.2}>
            <cylinderGeometry args={[0.66, 0.66, 2.4, 10]} />
            <meshStandardMaterial ref={i === 0 ? ends : undefined} color="#1a0c06" emissive="#ff6a1a" emissiveIntensity={1.6} roughness={0.8} />
          </mesh>
        </group>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[HEARTH[0], HEARTH[1] + 0.3, HEARTH[2]]}>
        <circleGeometry args={[6, 32]} />
        <meshStandardMaterial ref={bed} color="#2a1208" emissive="#ff7a2a" emissiveIntensity={2.5} roughness={1} />
      </mesh>
    </group>
  );
}
