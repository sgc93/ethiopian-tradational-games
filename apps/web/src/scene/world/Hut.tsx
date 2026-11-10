import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from '../layout';
import { SunBlob } from './sun';

/** Where the house stands: about 30 m off, beyond the far side of the board and to the right of the home view. */
export const HUT_CENTRE: [number, number, number] = [400, GROUND_Y, -440];
const WALL_RADIUS = 42;
const WALL_HEIGHT = 28;
const ROOF_RADIUS = 51;
const ROOF_HEIGHT = 36;
const DOOR = { width: 14, height: 22 };
/** The photographed plaster is in shade; this lifts it to mud plaster in the sun. */
const PLASTER = new THREE.Color(1.75, 1.6, 1.38);

/**
 * The round house (tukul): a plastered wall under a wide thatch cone with its clay finial, and a
 * timber-framed doorway facing the board, dark inside against the daylight.
 */
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
  // The door is built on the wall's −x side; the house is turned so that side faces the board.
  const turn = Math.atan2(-HUT_CENTRE[2], HUT_CENTRE[0]);
  const post = DOOR.width / 2 + 1;
  return (
    <>
      <group position={HUT_CENTRE} rotation-y={turn}>
        <mesh position-y={WALL_HEIGHT / 2}>
          <cylinderGeometry args={[WALL_RADIUS, WALL_RADIUS * 1.02, WALL_HEIGHT, 48, 1, true]} />
          <meshStandardMaterial map={tex.plaster} color={PLASTER} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        {/* The roof's underside shows as a dark line of eaves over the wall. */}
        <mesh position-y={WALL_HEIGHT + ROOF_HEIGHT / 2 - 3}>
          <coneGeometry args={[ROOF_RADIUS, ROOF_HEIGHT, 48, 1, true]} />
          <meshStandardMaterial map={tex.thatch} normalMap={tex.thatchNormal} color="#e9d3a4" roughness={1} side={THREE.DoubleSide} />
        </mesh>
        <mesh position-y={WALL_HEIGHT + ROOF_HEIGHT - 3.5}>
          <sphereGeometry args={[2.6, 12, 8]} />
          <meshStandardMaterial color="#6b3d24" roughness={0.8} />
        </mesh>
        {/* The doorway: dark inside, with two posts and a lintel of eucalyptus. */}
        <mesh position={[-WALL_RADIUS * 1.02 - 0.4, DOOR.height / 2, 0]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[DOOR.width, DOOR.height]} />
          <meshBasicMaterial color="#1a100a" />
        </mesh>
        {[-post, post].map((z) => (
          <mesh key={z} position={[-WALL_RADIUS * 1.02 - 0.8, DOOR.height / 2, z]}>
            <boxGeometry args={[1.6, DOOR.height + 2, 1.8]} />
            <meshStandardMaterial color="#5a3d26" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[-WALL_RADIUS * 1.02 - 0.8, DOOR.height + 1, 0]}>
          <boxGeometry args={[1.8, 2, DOOR.width + 6]} />
          <meshStandardMaterial color="#5a3d26" roughness={0.9} />
        </mesh>
      </group>
      <SunBlob at={[HUT_CENTRE[0], HUT_CENTRE[2]]} radius={ROOF_RADIUS * 0.85} height={WALL_HEIGHT + ROOF_HEIGHT * 0.5} opacity={0.42} />
    </>
  );
}
