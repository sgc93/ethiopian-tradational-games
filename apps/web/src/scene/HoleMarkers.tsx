import type { Player } from '@etg/gebeta-rules';
import { useMemo } from 'react';
import * as THREE from 'three';
import { HOLE_RADIUS, holeCenter } from './layout';

export const OWNER_TINT = ['#e0a85a', '#2f3a46'] as const;
const MARKER_COLOUR = ['#efe6d6', '#3a332e'] as const;
// A marks with a small triangle of pale pebbles, B with a short line of dark ones,
// so ownership never depends on colour alone.
const MARKER_OFFSETS: Record<Player, [number, number][]> = {
  0: [
    [-0.05, 0],
    [0.05, 0],
    [0, 0.07],
  ],
  1: [
    [-0.07, 0],
    [0, 0],
    [0.07, 0],
  ],
};

/** Shows who owns each hole: a tinted rim and marker pebbles on the owner's side of the hole. */
export function HoleMarkers({ owners }: { owners: readonly Player[] }) {
  const pebble = useMemo(() => new THREE.SphereGeometry(0.028, 8, 6).scale(1, 0.6, 0.9), []);
  return (
    <>
      {owners.map((owner, hole) => {
        const [cx, , cz] = holeCenter(hole);
        const side = owner === 0 ? 1 : -1; // A sits at +z, B at −z
        const mz = cz + side * (HOLE_RADIUS + 0.17);
        return (
          <group key={hole}>
            <mesh rotation-x={-Math.PI / 2} position={[cx, 0.03, cz]}>
              <ringGeometry args={[HOLE_RADIUS + 0.01, HOLE_RADIUS + 0.06, 48]} />
              <meshBasicMaterial color={OWNER_TINT[owner]} transparent opacity={0.5} depthWrite={false} />
            </mesh>
            {MARKER_OFFSETS[owner].map(([dx, dz], i) => (
              <mesh key={i} geometry={pebble} position={[cx + dx, 0.02, mz + side * dz]} castShadow>
                <meshStandardMaterial color={MARKER_COLOUR[owner]} roughness={0.8} />
              </mesh>
            ))}
          </group>
        );
      })}
    </>
  );
}
