import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from '../layout';

export const HUT_CENTRE: [number, number, number] = [150, GROUND_Y, 0];
const WALL_RADIUS = 60;
const WALL_HEIGHT = 36;
const ROOF_RADIUS = 68;
const ROOF_HEIGHT = 50;

/** The round hut 7.5 m beyond A's end: a plastered wall, a thatch cone, and a doorway glowing from inside. */
export function Hut() {
  const tex = useTexture({
    plaster: '/textures/plaster-color.webp',
    thatch: '/textures/thatch-color.webp',
    thatchNormal: '/textures/thatch-normal.webp',
  });
  useMemo(() => {
    for (const t of Object.values(tex)) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }
    tex.plaster.repeat.set(12, 2);
    tex.plaster.colorSpace = THREE.SRGBColorSpace;
    tex.thatch.repeat.set(16, 3);
    tex.thatch.colorSpace = THREE.SRGBColorSpace;
    tex.thatchNormal.repeat.set(16, 3);
  }, [tex]);
  const door = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (door.current) door.current.emissiveIntensity = 1.2 * (0.9 + 0.1 * Math.sin(0.7 * clock.elapsedTime));
  });
  return (
    <group position={HUT_CENTRE}>
      <mesh position-y={WALL_HEIGHT / 2} castShadow receiveShadow>
        <cylinderGeometry args={[WALL_RADIUS, WALL_RADIUS, WALL_HEIGHT, 48, 1, true]} />
        <meshStandardMaterial map={tex.plaster} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh position-y={WALL_HEIGHT + ROOF_HEIGHT / 2} castShadow>
        <coneGeometry args={[ROOF_RADIUS, ROOF_HEIGHT, 48, 1, true]} />
        <meshStandardMaterial map={tex.thatch} normalMap={tex.thatchNormal} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* The doorway, facing the board (−x), lit from inside. */}
      <mesh position={[-WALL_RADIUS + 0.2, 15, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[18, 30]} />
        <meshStandardMaterial ref={door} color="#2a1608" emissive="#ffb35c" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}
